"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";
import { type InsuranceCompany, InsuranceCompanySchema } from "@/types/crm";

const TABLE = "insurance_companies";

export async function getInsuranceCompanies() {
  try {
    const { data: companies, error } = await supabaseServer.from(TABLE).select("*").order("name", { ascending: true });

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, companies: companies as InsuranceCompany[] };
  } catch (error) {
    console.error(`[getInsuranceCompanies] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getInsuranceCompany(id: string) {
  try {
    const { data: company, error } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (error) throw new Error((error as { message: string }).message);
    if (!company) return { success: false, error: "Insurance Company not found" };

    return { success: true, company: company as InsuranceCompany };
  } catch (error) {
    console.error(`[getInsuranceCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createInsuranceCompany(data: Partial<InsuranceCompany>) {
  try {
    const validated = InsuranceCompanySchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/insurance-companies");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createInsuranceCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateInsuranceCompany(id: string, data: Partial<InsuranceCompany>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/insurance-companies");
    revalidatePath(`/dashboard/admin/insurance-companies/${id}`);

    return { success: true };
  } catch (error) {
    console.error(`[updateInsuranceCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteInsuranceCompany(id: string) {
  try {
    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/insurance-companies");

    return { success: true };
  } catch (error) {
    console.error(`[deleteInsuranceCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
