"use server";

import { revalidatePath } from "next/cache";

import type { PostgrestError } from "@supabase/supabase-js";

import { recordServiceLinkChanges } from "@/lib/history/service-links";
import { supabaseServer } from "@/lib/supabase.server";
import { type LongTermCareInsurance, LongTermCareInsuranceSchema, type Person } from "@/types/crm";

const TABLE = "long_term_care_insurance";

export async function getLongTermCareInsurances() {
  try {
    const { data: companies, error: companiesError } = await supabaseServer
      .from(TABLE)
      .select("*")
      .order("name", { ascending: true });

    if (companiesError) throw new Error((companiesError as { message: string }).message);
    if (!companies || companies.length === 0) return { success: true, companies: [] };

    // Fetch person details
    const personIds = Array.from(new Set(companies.flatMap((c) => c.personIds || [])));

    const { data: people, error: peopleError } =
      personIds.length > 0
        ? await supabaseServer.from("people").select("*").in("id", personIds)
        : { data: [], error: null as PostgrestError | null };

    if (peopleError) throw new Error(peopleError.message);

    const peopleMap = (people || []).reduce(
      (acc, person) => {
        acc[person.id] = person;
        return acc;
      },
      {} as Record<string, Person>,
    );

    const companiesWithDetails = companies.map((company) => ({
      ...company,
      people: ((company.personIds as string[]) || []).map((id: string) => peopleMap[id]).filter(Boolean),
    }));

    return { success: true, companies: companiesWithDetails };
  } catch (error) {
    console.error(`[getLongTermCareInsurances] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getLongTermCareInsurance(id: string) {
  try {
    const { data: company, error: companyError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (companyError) throw new Error((companyError as { message: string }).message);
    if (!company) return { success: false, error: "Long Term Care Insurance not found" };

    // Fetch people details
    let people: Person[] = [];
    if (company.personIds && company.personIds.length > 0) {
      const { data: peopleData, error: peopleError } = await supabaseServer
        .from("people")
        .select("*")
        .in("id", company.personIds);
      if (peopleError) throw new Error(peopleError.message);
      people = peopleData || [];
    }

    return { success: true, company: company as LongTermCareInsurance, people };
  } catch (error) {
    console.error(`[getLongTermCareInsurance] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createLongTermCareInsurance(data: Partial<LongTermCareInsurance>) {
  try {
    const validated = LongTermCareInsuranceSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    await recordServiceLinkChanges({
      table: TABLE,
      firmName: (inserted as any).name ?? (inserted as any).firmName ?? "",
      before: null,
      after: { clientIds: inserted.clientIds, companyIds: inserted.companyIds },
      mode: "added",
    });

    revalidatePath("/dashboard/admin/long-term-care-insurance");

    if (data.companyIds?.length) {
      data.companyIds.forEach((companyId) => {
        revalidatePath(`/dashboard/crm/companies/${companyId}`);
      });
    }

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createLongTermCareInsurance] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateLongTermCareInsurance(id: string, data: Partial<LongTermCareInsurance>) {
  try {
    const { data: historyBefore } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    await recordServiceLinkChanges({
      table: TABLE,
      firmName:
        (data as any).name ??
        (data as any).firmName ??
        (historyBefore as any)?.name ??
        (historyBefore as any)?.firmName ??
        "",
      before: { clientIds: historyBefore?.clientIds, companyIds: historyBefore?.companyIds },
      after: {
        clientIds: data.clientIds !== undefined ? data.clientIds : historyBefore?.clientIds,
        companyIds: data.companyIds !== undefined ? data.companyIds : historyBefore?.companyIds,
      },
    });

    revalidatePath("/dashboard/admin/long-term-care-insurance");
    revalidatePath(`/dashboard/admin/long-term-care-insurance/${id}`);

    if (data.companyIds?.length) {
      data.companyIds.forEach((companyId) => {
        revalidatePath(`/dashboard/crm/companies/${companyId}`);
      });
    }

    if (data.clientIds?.length) {
      data.clientIds.forEach((clientId) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[updateLongTermCareInsurance] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteLongTermCareInsurance(id: string) {
  try {
    const { data: company, error: getError } = await supabaseServer
      .from(TABLE)
      .select("companyIds, clientIds")
      .eq("id", id)
      .single();

    const { data: historyRemoved } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    if (historyRemoved) {
      await recordServiceLinkChanges({
        table: TABLE,
        firmName: (historyRemoved as any).name ?? (historyRemoved as any).firmName ?? "",
        before: { clientIds: historyRemoved.clientIds, companyIds: historyRemoved.companyIds },
        after: {},
        mode: "removed",
      });
    }

    revalidatePath("/dashboard/admin/long-term-care-insurance");

    if (!getError && company?.companyIds?.length) {
      (company.companyIds as string[]).forEach((companyId: string) => {
        revalidatePath(`/dashboard/crm/companies/${companyId}`);
      });
    }

    if (!getError && company?.clientIds?.length) {
      (company.clientIds as string[]).forEach((clientId: string) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[deleteLongTermCareInsurance] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function linkClientToLongTermCareInsurance(companyId: string, clientId: string) {
  try {
    const companyRes = await getLongTermCareInsurance(companyId);
    if (!companyRes.success || !companyRes.company) return { success: false, error: "Company not found" };

    const currentIds = companyRes.company.clientIds || [];
    if (currentIds.includes(clientId)) return { success: true };

    return updateLongTermCareInsurance(companyId, { clientIds: [...currentIds, clientId] });
  } catch (error) {
    console.error(`[linkClientToLongTermCareInsurance] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function unlinkClientFromLongTermCareInsurance(companyId: string, clientId: string) {
  try {
    const companyRes = await getLongTermCareInsurance(companyId);
    if (!companyRes.success || !companyRes.company) return { success: false, error: "Company not found" };

    const currentIds = companyRes.company.clientIds || [];
    if (!currentIds.includes(clientId)) return { success: true };

    return updateLongTermCareInsurance(companyId, { clientIds: currentIds.filter((id) => id !== clientId) });
  } catch (error) {
    console.error(`[unlinkClientFromLongTermCareInsurance] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function linkCompanyToLongTermCareInsurance(firmId: string, companyId: string) {
  try {
    const firmRes = await getLongTermCareInsurance(firmId);
    if (!firmRes.success || !firmRes.company) return { success: false, error: "LongTermCareInsurance not found" };

    const currentIds = firmRes.company.companyIds || [];
    if (currentIds.includes(companyId)) return { success: true }; // already linked

    return updateLongTermCareInsurance(firmId, { companyIds: [...currentIds, companyId] });
  } catch (error) {
    console.error(`[linkCompanyToLongTermCareInsurance] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function unlinkCompanyFromLongTermCareInsurance(firmId: string, companyId: string) {
  try {
    const firmRes = await getLongTermCareInsurance(firmId);
    if (!firmRes.success || !firmRes.company) return { success: false, error: "LongTermCareInsurance not found" };

    const currentIds = firmRes.company.companyIds || [];
    if (!currentIds.includes(companyId)) return { success: true }; // already unlinked

    return updateLongTermCareInsurance(firmId, { companyIds: currentIds.filter((id: string) => id !== companyId) });
  } catch (error) {
    console.error(`[unlinkCompanyFromLongTermCareInsurance] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
