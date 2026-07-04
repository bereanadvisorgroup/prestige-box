"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";
import { type Custodian, CustodianSchema } from "@/types/crm";

const TABLE = "custodians";

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
 * Fetch all custodians sorted alphabetically by name.
 */
export async function getCustodians() {
  try {
    const { data: list, error } = await supabaseServer.from(TABLE).select("*").order("name", { ascending: true });

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, custodians: (list || []) as Custodian[] };
  } catch (error) {
    console.error("[getCustodians] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch a single custodian by ID.
 */
export async function getCustodian(id: string) {
  try {
    const { data: record, error } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, custodian: record as Custodian };
  } catch (error) {
    console.error("[getCustodian] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Create a new custodian. Only allowed for admins.
 */
export async function createCustodian(data: Partial<Custodian>) {
  try {
    await verifyAdmin();

    const validated = CustodianSchema.parse({
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

    revalidatePath("/dashboard/admin/custodians");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error("[createCustodian] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update an existing custodian. Only allowed for admins.
 */
export async function updateCustodian(id: string, data: Partial<Custodian>) {
  try {
    await verifyAdmin();

    const validated = CustodianSchema.parse({
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

    revalidatePath("/dashboard/admin/custodians");
    revalidatePath(`/dashboard/admin/custodians/${id}`);

    return { success: true };
  } catch (error) {
    console.error("[updateCustodian] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete a custodian. Only allowed for admins.
 */
export async function deleteCustodian(id: string) {
  try {
    await verifyAdmin();

    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/custodians");

    return { success: true };
  } catch (error) {
    console.error("[deleteCustodian] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
