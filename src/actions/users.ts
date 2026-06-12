"use server";

import { revalidatePath } from "next/cache";

import { Resend } from "resend";

import { supabaseServer } from "@/lib/supabase.server";

export async function createUser(data: {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
  origin: string;
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
      app_metadata: {
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

    // 3. Send initial password reset email
    try {
      await resetUserPassword(authRecord.user.id, data.email, data.origin);
    } catch (emailErr) {
      console.error("[createUser] Warning: Failed to send initial password reset email:", emailErr);
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

    // Fetch auth users to map providers
    const providerMap = new Map<string, string[]>();
    try {
      const {
        data: { users: authUsers },
        error: authError,
      } = await supabaseServer.auth.admin.listUsers({ perPage: 1000 });
      if (authError) throw authError;
      if (authUsers) {
        for (const authUser of authUsers) {
          const providers =
            authUser.app_metadata?.providers ||
            (authUser.identities || []).map((i) => i.provider) ||
            [authUser.app_metadata?.provider].filter(Boolean) ||
            [];
          providerMap.set(authUser.id, providers);
        }
      }
    } catch (authErr) {
      console.warn("[getUsers] Failed to fetch auth providers:", authErr);
    }

    const users = (dbUsers || []).map((dbUser) => ({
      uid: dbUser.uid,
      email: dbUser.email || "",
      firstName: dbUser.firstName || "",
      lastName: dbUser.lastName || "",
      role: dbUser.role || "client",
      createdAt: dbUser.createdAt || new Date().toISOString(),
      photoURL: dbUser.photoURL || "",
      providers: providerMap.get(dbUser.uid) || [],
    }));

    return { success: true, users };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateUser(
  uid: string,
  data: { firstName: string; lastName: string; role: string; photoURL?: string | null },
) {
  try {
    // Update Document in public.users table
    const { error: dbError } = await supabaseServer
      .from("users")
      .update({
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        photoURL: data.photoURL ?? null,
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
      app_metadata: {
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

export async function resetUserPassword(_uid: string, email: string, origin: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const linkResult = await generateUserRecoveryLink(email, origin);

    if (!linkResult.success || !linkResult.link) {
      throw new Error(linkResult.error || "Failed to generate recovery link");
    }

    const { error: resendError } = await resend.emails.send({
      from: "Prestige Advisors <noreply@contact.bereanadvisorgroup.com>",
      to: email,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the button below to choose a new password:</p>
          <div style="margin: 30px 0;">
            <a href="${linkResult.link}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          <br />
          <p style="color: #666; font-size: 14px;">Or, copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${linkResult.link}</p>
        </div>
      `,
    });

    if (resendError) throw new Error(resendError.message);

    return { success: true };
  } catch (error) {
    console.error("Failed to reset password for user:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function generateUserRecoveryLink(email: string, origin: string) {
  try {
    const { data, error } = await supabaseServer.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${origin}/auth/v1/reset-password`,
      },
    });
    if (error) throw error;
    if (!data.properties?.action_link) {
      throw new Error("No recovery link generated by Supabase.");
    }
    return { success: true, link: data.properties.action_link };
  } catch (error) {
    console.error("Failed to generate recovery link:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}
