"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";
import { type FinancialAccountType, FinancialAccountTypeSchema } from "@/types/crm";

const TABLE = "financial_account_types";

/**
 * Helper to verify that the current user is authenticated and has the admin role.
 */
async function verifyAdmin() {
  const {
    data: { user },
    error: authError,
  } = await supabaseServer.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: Please sign in.");
  }

  const { data: dbUser, error: dbUserError } = await supabaseServer
    .from("users")
    .select("role")
    .eq("uid", user.id)
    .single();

  if (dbUserError || !dbUser || dbUser.role !== "admin") {
    throw new Error("Unauthorized: Admin role required.");
  }
}

/**
 * Fetch all financial account types sorted alphabetically.
 */
export async function getFinancialAccountTypes() {
  try {
    const { data: types, error } = await supabaseServer.from(TABLE).select("*").order("name", { ascending: true });

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, types: (types || []) as FinancialAccountType[] };
  } catch (error) {
    console.error("[getFinancialAccountTypes] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch a single financial account type by ID.
 */
export async function getFinancialAccountType(id: string) {
  try {
    const { data: type, error } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, type: type as FinancialAccountType };
  } catch (error) {
    console.error("[getFinancialAccountType] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Create a new financial account type. Only allowed for admins.
 */
export async function createFinancialAccountType(data: Partial<FinancialAccountType>) {
  try {
    await verifyAdmin();

    const validated = FinancialAccountTypeSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer
      .from(TABLE)
      .insert({ name: validated.name })
      .select()
      .single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/financial-account-types");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error("[createFinancialAccountType] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update an existing financial account type. Only allowed for admins.
 */
export async function updateFinancialAccountType(id: string, data: Partial<FinancialAccountType>) {
  try {
    await verifyAdmin();

    const validated = FinancialAccountTypeSchema.parse({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    const { error } = await supabaseServer
      .from(TABLE)
      .update({
        name: validated.name,
        updatedAt: validated.updatedAt,
      })
      .eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/financial-account-types");
    revalidatePath(`/dashboard/admin/financial-account-types/${id}`);

    return { success: true };
  } catch (error) {
    console.error("[updateFinancialAccountType] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete a financial account type. Only allowed for admins.
 */
export async function deleteFinancialAccountType(id: string) {
  try {
    await verifyAdmin();

    // Delete type record
    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/financial-account-types");

    return { success: true };
  } catch (error) {
    console.error("[deleteFinancialAccountType] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
