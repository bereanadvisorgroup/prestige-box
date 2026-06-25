"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";

export async function getBusinessContact() {
  try {
    const { data, error } = await supabaseServer
      .from("keyvals")
      .select("id, value")
      .in("id", ["BUSINESS_EMAIL", "BUSINESS_PHONE"]);

    if (error) throw error;

    const emailObj = data?.find((item) => item.id === "BUSINESS_EMAIL");
    const phoneObj = data?.find((item) => item.id === "BUSINESS_PHONE");

    return {
      success: true,
      email: emailObj?.value || "info@prestigeadvisors360.com",
      phone: phoneObj?.value || "941-799-3300",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error) || String(error);
    console.error("Failed to fetch business contact details:", errorMsg, error);
    return {
      success: false,
      error: errorMsg,
      email: "info@prestigeadvisors360.com",
      phone: "941-799-3300",
    };
  }
}

export async function updateBusinessContact(email: string, phone: string) {
  try {
    // Security Check: Only authenticated users with admin role can modify settings.
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized: Please sign in.");
    }

    // Check role in public.users
    const { data: dbUser, error: dbUserError } = await supabaseServer
      .from("users")
      .select("role")
      .eq("uid", user.id)
      .single();

    if (dbUserError || !dbUser || dbUser.role !== "admin") {
      throw new Error("Unauthorized: Admin role required.");
    }

    // Upsert email
    const { error: emailError } = await supabaseServer
      .from("keyvals")
      .upsert({ id: "BUSINESS_EMAIL", value: email, updatedAt: new Date().toISOString() });

    if (emailError) throw emailError;

    // Upsert phone
    const { error: phoneError } = await supabaseServer
      .from("keyvals")
      .upsert({ id: "BUSINESS_PHONE", value: phone, updatedAt: new Date().toISOString() });

    if (phoneError) throw phoneError;

    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update business contact details:", error);
    return { success: false, error: (error as Error).message };
  }
}
