"use server";

import { supabaseServer } from "@/lib/supabase.server";

async function getAuthUserByEmail(email: string) {
  const { data, error } = await supabaseServer.auth.admin.listUsers({
    perPage: 1000,
  });
  if (error) throw error;
  const user = data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  return user || null;
}

export async function checkUserStatus(email: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if email exists in public.users
    const { data: dbUser, error: dbError } = await supabaseServer
      .from("users")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (dbError) throw dbError;

    if (!dbUser) {
      return { success: true, status: "no_account" as const };
    }

    // 2. Check if user exists in auth.users
    const authUser = await getAuthUserByEmail(cleanEmail);
    const hasAuth = !!authUser;

    if (!hasAuth) {
      return { success: true, status: "create_account" as const, email: cleanEmail };
    }

    return { success: true, status: "login" as const, email: cleanEmail };
  } catch (error) {
    console.error("Failed to check user status:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function registerUserWithPassword(data: { email: string; password: string }) {
  try {
    const cleanEmail = data.email.trim().toLowerCase();

    // 1. Verify whitelisting
    const { data: dbUser, error: dbError } = await supabaseServer
      .from("users")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (dbError) throw dbError;
    if (!dbUser) {
      return { success: false, error: "You do not have an account, please contact our office for assistance." };
    }

    // 2. Verify no existing auth record
    const authUser = await getAuthUserByEmail(cleanEmail);
    if (authUser) {
      return { success: false, error: "An account already exists for this email address. Please sign in." };
    }

    // 3. Create the user in auth.users
    const { data: authRecord, error: authError } = await supabaseServer.auth.admin.createUser({
      email: cleanEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role,
      },
      app_metadata: {
        role: dbUser.role,
      },
    });

    if (authError) throw authError;
    if (!authRecord?.user) throw new Error("Failed to create auth record.");

    // Note: The `AFTER INSERT` trigger `tr_sync_user_profile_uid` will automatically
    // update the `uid` column in public.users to match `authRecord.user.id`.

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function registerUserWithPasskeyInit(data: { email: string }) {
  try {
    const cleanEmail = data.email.trim().toLowerCase();

    // 1. Verify whitelisting
    const { data: dbUser, error: dbError } = await supabaseServer
      .from("users")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (dbError) throw dbError;
    if (!dbUser) {
      return { success: false, error: "You do not have an account, please contact our office for assistance." };
    }

    // 2. Verify no existing auth record
    const authUser = await getAuthUserByEmail(cleanEmail);
    if (authUser) {
      return { success: false, error: "An account already exists for this email address. Please sign in." };
    }

    // 3. Create auth user with temporary random password
    const tempPassword = `${Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)}A1!`;
    const { data: authRecord, error: authError } = await supabaseServer.auth.admin.createUser({
      email: cleanEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role,
      },
      app_metadata: {
        role: dbUser.role,
      },
    });

    if (authError) throw authError;
    if (!authRecord?.user) throw new Error("Failed to create auth record.");

    return { success: true, tempPassword };
  } catch (error) {
    console.error("Passkey registration initialization error:", error);
    return { success: false, error: (error as Error).message };
  }
}
