"use server";

import { revalidatePath } from "next/cache";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabaseServer } from "@/lib/supabase.server";
import { type DisabilityInsuranceCompany, DisabilityInsuranceCompanySchema, type Person } from "@/types/crm";

const TABLE = "disability_insurance_companies";

export async function getDisabilityInsuranceCompanies() {
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
    console.error(`[getDisabilityInsuranceCompanies] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getDisabilityInsuranceCompany(id: string) {
  try {
    const { data: company, error: companyError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (companyError) throw new Error((companyError as { message: string }).message);
    if (!company) return { success: false, error: "Disability Insurance Company not found" };

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

    return { success: true, company: company as DisabilityInsuranceCompany, people };
  } catch (error) {
    console.error(`[getDisabilityInsuranceCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createDisabilityInsuranceCompany(data: Partial<DisabilityInsuranceCompany>) {
  try {
    const validated = DisabilityInsuranceCompanySchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/disability-insurance-companies");

    if (data.companyIds?.length) {
      data.companyIds.forEach((companyId) => {
        revalidatePath(`/dashboard/crm/companies/${companyId}`);
      });
    }

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createDisabilityInsuranceCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateDisabilityInsuranceCompany(id: string, data: Partial<DisabilityInsuranceCompany>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/disability-insurance-companies");
    revalidatePath(`/dashboard/admin/disability-insurance-companies/${id}`);

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
    console.error(`[updateDisabilityInsuranceCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteDisabilityInsuranceCompany(id: string) {
  try {
    const { data: company, error: getError } = await supabaseServer
      .from(TABLE)
      .select("companyIds, clientIds")
      .eq("id", id)
      .single();

    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/disability-insurance-companies");

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
    console.error(`[deleteDisabilityInsuranceCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function linkClientToDisabilityInsuranceCompany(companyId: string, clientId: string) {
  try {
    const companyRes = await getDisabilityInsuranceCompany(companyId);
    if (!companyRes.success || !companyRes.company) return { success: false, error: "Company not found" };

    const currentIds = companyRes.company.clientIds || [];
    if (currentIds.includes(clientId)) return { success: true };

    return updateDisabilityInsuranceCompany(companyId, { clientIds: [...currentIds, clientId] });
  } catch (error) {
    console.error(`[linkClientToDisabilityInsuranceCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function unlinkClientFromDisabilityInsuranceCompany(companyId: string, clientId: string) {
  try {
    const companyRes = await getDisabilityInsuranceCompany(companyId);
    if (!companyRes.success || !companyRes.company) return { success: false, error: "Company not found" };

    const currentIds = companyRes.company.clientIds || [];
    if (!currentIds.includes(clientId)) return { success: true };

    return updateDisabilityInsuranceCompany(companyId, { clientIds: currentIds.filter((id) => id !== clientId) });
  } catch (error) {
    console.error(`[unlinkClientFromDisabilityInsuranceCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function linkCompanyToDisabilityInsuranceCompany(firmId: string, companyId: string) {
  try {
    const firmRes = await getDisabilityInsuranceCompany(firmId);
    if (!firmRes.success || !firmRes.company) return { success: false, error: "DisabilityInsuranceCompany not found" };

    const currentIds = firmRes.company.companyIds || [];
    if (currentIds.includes(companyId)) return { success: true }; // already linked

    return updateDisabilityInsuranceCompany(firmId, { companyIds: [...currentIds, companyId] });
  } catch (error) {
    console.error(`[linkCompanyToDisabilityInsuranceCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function unlinkCompanyFromDisabilityInsuranceCompany(firmId: string, companyId: string) {
  try {
    const firmRes = await getDisabilityInsuranceCompany(firmId);
    if (!firmRes.success || !firmRes.company) return { success: false, error: "DisabilityInsuranceCompany not found" };

    const currentIds = firmRes.company.companyIds || [];
    if (!currentIds.includes(companyId)) return { success: true }; // already unlinked

    return updateDisabilityInsuranceCompany(firmId, {
      companyIds: currentIds.filter((id: string) => id !== companyId),
    });
  } catch (error) {
    console.error(`[unlinkCompanyFromDisabilityInsuranceCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
