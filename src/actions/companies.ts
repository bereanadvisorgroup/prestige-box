"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";
import { type Company, CompanySchema } from "@/types/crm";

const TABLE = "companies";

export async function getCompanies() {
  try {
    const { data: companies, error } = await supabaseServer.from(TABLE).select("*");

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, companies: companies as Company[] };
  } catch (error) {
    console.error(`[getCompanies] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getCompaniesByClient(clientId: string) {
  try {
    const { data: companies, error } = await supabaseServer.from(TABLE).select("*").contains("clientIds", [clientId]);

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, companies: companies as Company[] };
  } catch (error) {
    console.error(`[getCompaniesByClient] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getCompany(id: string) {
  try {
    const { data: company, error } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (error) throw new Error((error as { message: string }).message);
    if (!company) return { success: false, error: "Company not found" };

    return { success: true, company: company as Company };
  } catch (error) {
    console.error(`[getCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createCompany(data: Partial<Company>) {
  try {
    const validated = CompanySchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/companies");
    if (data.clientIds?.length) {
      data.clientIds.forEach((id) => {
        revalidatePath(`/dashboard/crm/clients/${id}`);
      });
    }

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateCompany(id: string, data: Partial<Company>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/companies");
    revalidatePath(`/dashboard/crm/companies/${id}`);

    if (data.clientIds?.length) {
      data.clientIds.forEach((clientId) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[updateCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteCompany(id: string) {
  try {
    const { data: company, error: getError } = await supabaseServer
      .from(TABLE)
      .select("clientIds")
      .eq("id", id)
      .single();

    if (getError) throw new Error((getError as { message: string }).message);

    const { error: deleteError } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (deleteError) throw new Error((deleteError as { message: string }).message);

    revalidatePath("/dashboard/crm/companies");

    if (company?.clientIds?.length) {
      (company.clientIds as string[]).forEach((clientId: string) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[deleteCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
