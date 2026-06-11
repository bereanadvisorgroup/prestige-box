"use server";

import { revalidatePath } from "next/cache";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabaseServer } from "@/lib/supabase.server";
import { type LongTermCareInsurance, LongTermCareInsuranceSchema } from "@/types/crm";

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
      {} as Record<string, any>,
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
    let people: any[] = [];
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

    revalidatePath("/dashboard/admin/long-term-care-insurance");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createLongTermCareInsurance] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateLongTermCareInsurance(id: string, data: Partial<LongTermCareInsurance>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/long-term-care-insurance");
    revalidatePath(`/dashboard/admin/long-term-care-insurance/${id}`);

    return { success: true };
  } catch (error) {
    console.error(`[updateLongTermCareInsurance] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteLongTermCareInsurance(id: string) {
  try {
    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/long-term-care-insurance");

    return { success: true };
  } catch (error) {
    console.error(`[deleteLongTermCareInsurance] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
