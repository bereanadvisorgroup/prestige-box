"use server";

import { revalidatePath } from "next/cache";

import type { PostgrestError } from "@supabase/supabase-js";

import { CLIENT_POLICY_FIELDS } from "@/lib/history/fields";
import { recordEvent, recordFieldDiffs } from "@/lib/history/record";
import { supabaseServer } from "@/lib/supabase.server";
import { formatFullName } from "@/lib/utils";
import { type ClientPolicy, ClientPolicySchema } from "@/types/crm";

import { removeAutoTask, syncRenewalForPolicy } from "./task-sync";

const TABLE = "client_policies";

/** Derives the history subtype from which insurance carrier a policy references. */
function policySubType(policy: Partial<ClientPolicy>): string {
  if (policy.lifeInsuranceCompanyId) return "Life Insurance";
  if (policy.disabilityInsuranceCompanyId) return "Disability Insurance";
  if (policy.longTermCareInsuranceId) return "Long Term Care";
  return "Policy";
}

export async function getClientPolicies() {
  try {
    const { data: policies, error: policiesError } = await supabaseServer
      .from(TABLE)
      .select("*")
      .order("createdAt", { ascending: false });

    if (policiesError) throw new Error((policiesError as { message: string }).message);
    if (!policies || policies.length === 0) return { success: true, policies: [] };

    // Enrich with client and company data
    const clientIds = Array.from(new Set(policies.map((p) => p.clientId)));
    const companyIds = Array.from(new Set(policies.map((p) => p.lifeInsuranceCompanyId).filter(Boolean)));
    const disabilityCompanyIds = Array.from(
      new Set(policies.map((p) => p.disabilityInsuranceCompanyId).filter(Boolean)),
    );
    const longTermCareInsuranceIds = Array.from(
      new Set(policies.map((p) => p.longTermCareInsuranceId).filter(Boolean)),
    );
    const managingAgencyIds = Array.from(new Set(policies.map((p) => p.managingAgencyId).filter(Boolean)));

    const [clientsResult, companiesResult, disabilityCompaniesResult, longTermCareResult, agenciesResult] =
      await Promise.all([
        clientIds.length > 0
          ? supabaseServer.from("clients").select("id, personId").in("id", clientIds)
          : Promise.resolve({ data: [] as never[], error: null as PostgrestError | null }),
        companyIds.length > 0
          ? supabaseServer.from("life_insurance_companies").select("id, name").in("id", companyIds)
          : Promise.resolve({ data: [] as never[], error: null as PostgrestError | null }),
        disabilityCompanyIds.length > 0
          ? supabaseServer.from("disability_insurance_companies").select("id, name").in("id", disabilityCompanyIds)
          : Promise.resolve({ data: [] as never[], error: null as PostgrestError | null }),
        longTermCareInsuranceIds.length > 0
          ? supabaseServer.from("long_term_care_insurance").select("id, name").in("id", longTermCareInsuranceIds)
          : Promise.resolve({ data: [] as never[], error: null as PostgrestError | null }),
        managingAgencyIds.length > 0
          ? supabaseServer.from("insurance_agencies").select("id, firmName").in("id", managingAgencyIds)
          : Promise.resolve({ data: [] as never[], error: null as PostgrestError | null }),
      ]);

    if (clientsResult.error) throw new Error(clientsResult.error.message);
    if (companiesResult.error) throw new Error(companiesResult.error.message);
    if (disabilityCompaniesResult.error) throw new Error(disabilityCompaniesResult.error.message);
    if (longTermCareResult.error) throw new Error(longTermCareResult.error.message);
    if (agenciesResult.error) throw new Error(agenciesResult.error.message);

    const clients = clientsResult.data || [];
    const companies = companiesResult.data || [];
    const disabilityCompanies = disabilityCompaniesResult.data || [];
    const longTermCareInsurances = longTermCareResult.data || [];
    const agencies = agenciesResult.data || [];
    const agenciesMap = agencies.reduce(
      (acc, a) => {
        acc[a.id] = a.firmName;
        return acc;
      },
      {} as Record<string, string>,
    );
    const companiesMap = [...companies, ...disabilityCompanies, ...longTermCareInsurances].reduce(
      (acc, c) => {
        acc[c.id] = c.name;
        return acc;
      },
      {} as Record<string, string>,
    );

    const personIds = Array.from(new Set(clients.map((c) => c.personId)));
    let peopleMap: Record<string, { name: string; photoUrl: string | null }> = {};
    if (personIds.length > 0) {
      const { data: people, error: peopleError } = await supabaseServer
        .from("people")
        .select("id, firstName, lastName, suffix, photoUrl")
        .in("id", personIds);
      if (peopleError) throw new Error((peopleError as { message: string }).message);
      peopleMap = (people || []).reduce(
        (acc, p) => {
          acc[p.id] = {
            name: formatFullName(p.firstName, p.lastName, p.suffix),
            photoUrl: p.photoUrl || null,
          };
          return acc;
        },
        {} as Record<string, { name: string; photoUrl: string | null }>,
      );
    }

    const clientsMap = clients.reduce(
      (acc, c) => {
        acc[c.id] = peopleMap[c.personId] || { name: "Unknown Client", photoUrl: null };
        return acc;
      },
      {} as Record<string, { name: string; photoUrl: string | null }>,
    );

    const enrichedPolicies = policies.map((policy) => ({
      ...policy,
      clientName: clientsMap[policy.clientId]?.name || "Unknown Client",
      clientPhotoUrl: clientsMap[policy.clientId]?.photoUrl || null,
      carrierName:
        companiesMap[
          policy.lifeInsuranceCompanyId || policy.disabilityInsuranceCompanyId || policy.longTermCareInsuranceId || ""
        ] || "Unknown Carrier",
      managingAgencyName: policy.managingAgencyId ? agenciesMap[policy.managingAgencyId] || null : null,
    }));

    return { success: true, policies: enrichedPolicies };
  } catch (error) {
    console.error(`[getClientPolicies] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getClientPolicy(id: string) {
  try {
    const { data: policy, error } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (error) throw new Error((error as { message: string }).message);
    if (!policy) return { success: false, error: "Policy not found" };

    return { success: true, policy: policy as ClientPolicy };
  } catch (error) {
    console.error(`[getClientPolicy] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createClientPolicy(data: Partial<ClientPolicy>) {
  try {
    const validated = ClientPolicySchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    const subType = policySubType(inserted);
    await recordEvent({
      entityType: "client",
      entityId: inserted.clientId,
      subType,
      action: "added",
      fieldName: "policy",
      fieldLabel: "Policy",
      newValue: inserted.policyName,
      summary: `${subType} policy added for client`,
    });

    // Create the auto-generated renewal task for this policy.
    await syncRenewalForPolicy(inserted.id);

    revalidatePath("/dashboard/crm/policies");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createClientPolicy] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateClientPolicy(id: string, data: Partial<ClientPolicy>) {
  try {
    const { data: current } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    if (current) {
      await recordFieldDiffs({
        entityType: "client",
        entityId: current.clientId,
        subType: policySubType(current),
        before: current,
        after: { ...current, ...data },
        fields: CLIENT_POLICY_FIELDS,
      });
    }

    // Keep the renewal task aligned with the (possibly changed) renewalDate.
    await syncRenewalForPolicy(id);

    revalidatePath("/dashboard/crm/policies");
    revalidatePath(`/dashboard/crm/policies/${id}`);

    return { success: true };
  } catch (error) {
    console.error(`[updateClientPolicy] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteClientPolicy(id: string) {
  try {
    const { data: current } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    if (current) {
      const subType = policySubType(current);
      await recordEvent({
        entityType: "client",
        entityId: current.clientId,
        subType,
        action: "removed",
        fieldName: "policy",
        fieldLabel: "Policy",
        oldValue: current.policyName,
        summary: `${subType} policy removed from client`,
      });
    }

    // Remove the policy's auto-generated renewal task.
    await removeAutoTask("renewal", id);

    revalidatePath("/dashboard/crm/policies");

    return { success: true };
  } catch (error) {
    console.error(`[deleteClientPolicy] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getClientPoliciesByClient(clientId: string) {
  try {
    const { data: policies, error } = await supabaseServer.from(TABLE).select("*").eq("clientId", clientId);

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, policies: policies as (ClientPolicy & { id: string })[] };
  } catch (error) {
    console.error(`[getClientPoliciesByClient] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
