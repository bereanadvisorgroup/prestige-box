"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";
import { type ReferralType, ReferralTypeSchema } from "@/types/crm";

const TABLE = "referral_types";

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
 * Fetch all referral types sorted alphabetically by name.
 */
export async function getReferralTypes() {
  try {
    const { data: list, error } = await supabaseServer.from(TABLE).select("*").order("name", { ascending: true });

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, referralTypes: (list || []) as ReferralType[] };
  } catch (error) {
    console.error("[getReferralTypes] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch a single referral type by ID.
 */
export async function getReferralType(id: string) {
  try {
    const { data: record, error } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, referralType: record as ReferralType };
  } catch (error) {
    console.error("[getReferralType] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Create a new referral type. Only allowed for admins.
 */
export async function createReferralType(data: Partial<ReferralType>) {
  try {
    await verifyAdmin();

    const validated = ReferralTypeSchema.parse({
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

    revalidatePath("/dashboard/admin/referral-types");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error("[createReferralType] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update an existing referral type. Only allowed for admins.
 */
export async function updateReferralType(id: string, data: Partial<ReferralType>) {
  try {
    await verifyAdmin();

    const validated = ReferralTypeSchema.parse({
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

    revalidatePath("/dashboard/admin/referral-types");
    revalidatePath(`/dashboard/admin/referral-types/${id}`);

    return { success: true };
  } catch (error) {
    console.error("[updateReferralType] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete a referral type. Only allowed for admins.
 */
export async function deleteReferralType(id: string) {
  try {
    await verifyAdmin();

    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/referral-types");

    return { success: true };
  } catch (error) {
    console.error("[deleteReferralType] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
