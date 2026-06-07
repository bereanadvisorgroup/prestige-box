"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";

export async function createUser(data: {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
}) {
  try {
    // 1. Create User in Supabase Auth via Admin API
    const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    const { data: authRecord, error: authError } = await supabaseServer.auth.admin.createUser({
      email: data.email,
      password: data.password || randomPassword,
      email_confirm: true,
      user_metadata: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      },
    });

    if (authError) throw new Error(authError.message);
    if (!authRecord.user) throw new Error("Failed to create user auth record.");

    // 2. Create User Profile Document in public.users table
    const userProfile = {
      uid: authRecord.user.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error: dbError } = await supabaseServer.from("users").upsert(userProfile);

    if (dbError) {
      console.error("[createUser] Warning: Database profile insert failed, trigger may handle this:", dbError.message);
    }

    revalidatePath("/dashboard/admin/users");

    return { success: true, user: userProfile };
  } catch (error) {
    console.error("Failed to create user:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getUsers() {
  try {
    // Fetch all user profiles from public.users table
    const { data: dbUsers, error } = await supabaseServer
      .from("users")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);

    const users = (dbUsers || []).map((dbUser) => ({
      uid: dbUser.uid,
      email: dbUser.email || "",
      firstName: dbUser.firstName || "",
      lastName: dbUser.lastName || "",
      role: dbUser.role || "client",
      createdAt: dbUser.createdAt || new Date().toISOString(),
      photoURL: dbUser.photoURL || "",
    }));

    return { success: true, users };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateUser(uid: string, data: { firstName: string; lastName: string; role: string }) {
  try {
    // Update Document in public.users table
    const { error: dbError } = await supabaseServer
      .from("users")
      .update({
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        updatedAt: new Date().toISOString(),
      })
      .eq("uid", uid);

    if (dbError) throw new Error(dbError.message);

    // Update user metadata in Supabase Auth
    const { error: authError } = await supabaseServer.auth.admin.updateUserById(uid, {
      user_metadata: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      },
    });

    if (authError) {
      console.error("[updateUser] Warning: Auth metadata update failed:", authError.message);
    }

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to update user:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteUser(uid: string) {
  try {
    // 1. Delete from Supabase Auth
    const { error: authError } = await supabaseServer.auth.admin.deleteUser(uid);
    if (authError) throw new Error(authError.message);

    // 2. Delete Profile Document in public.users table
    const { error: dbError } = await supabaseServer.from("users").delete().eq("uid", uid);

    if (dbError) {
      console.error("[deleteUser] Warning: Database profile delete failed:", dbError.message);
    }

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getUser(uid: string) {
  try {
    const { data: dbUser, error } = await supabaseServer.from("users").select("*").eq("uid", uid).single();

    if (error) throw new Error(error.message);
    if (!dbUser) return { success: false, error: "User not found" };

    const user = {
      uid: dbUser.uid,
      email: dbUser.email || "",
      firstName: dbUser.firstName || "",
      lastName: dbUser.lastName || "",
      role: dbUser.role || "client",
      createdAt: dbUser.createdAt || new Date().toISOString(),
      photoURL: dbUser.photoURL || "",
    };

    return { success: true, user };
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}
