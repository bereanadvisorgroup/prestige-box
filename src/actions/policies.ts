"use server";

import { revalidatePath } from "next/cache";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabaseServer } from "@/lib/supabase.server";
import { type ClientPolicy, ClientPolicySchema } from "@/types/crm";

const TABLE = "client_policies";

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
    const companyIds = Array.from(new Set(policies.map((p) => p.insuranceCompanyId)));

    const [clientsResult, companiesResult] = await Promise.all([
      clientIds.length > 0
        ? supabaseServer.from("clients").select("id, personId").in("id", clientIds)
        : Promise.resolve({ data: [] as never[], error: null as PostgrestError | null }),
      companyIds.length > 0
        ? supabaseServer.from("insurance_companies").select("id, name").in("id", companyIds)
        : Promise.resolve({ data: [] as never[], error: null as PostgrestError | null }),
    ]);

    if (clientsResult.error) throw new Error(clientsResult.error.message);
    if (companiesResult.error) throw new Error(companiesResult.error.message);

    const clients = clientsResult.data || [];
    const companies = companiesResult.data || [];
    const companiesMap = companies.reduce(
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
        .select("id, firstName, lastName, photoUrl")
        .in("id", personIds);
      if (peopleError) throw new Error((peopleError as { message: string }).message);
      peopleMap = (people || []).reduce(
        (acc, p) => {
          acc[p.id] = {
            name: `${p.firstName} ${p.lastName}`,
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
      carrierName: companiesMap[policy.insuranceCompanyId] || "Unknown Carrier",
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

    revalidatePath("/dashboard/crm/policies");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createClientPolicy] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateClientPolicy(id: string, data: Partial<ClientPolicy>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

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
    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

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
