"use server";

import { revalidatePath } from "next/cache";

import { Resend } from "resend";

import { adminAuth, adminDb } from "@/lib/firebase.server";

export async function createUser(data: {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
  origin: string;
}) {
  try {
    const cleanEmail = data.email.trim().toLowerCase();

    // 1. Create User in Firebase Auth via Admin SDK
    const randomPassword = `${Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)}A1!`;
    const userRecord = await adminAuth.createUser({
      email: cleanEmail,
      password: data.password || randomPassword,
      displayName: `${data.firstName} ${data.lastName}`.trim(),
    });

    const userProfile = {
      uid: userRecord.uid,
      id: userRecord.uid,
      email: cleanEmail,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 2. Insert Profile Document in Firestore users collection
    await adminDb.collection("users").doc(userRecord.uid).set(userProfile);

    // 3. Send initial password reset email or client setup email
    try {
      if (data.role === "client") {
        await sendClientSetupEmail(userRecord.uid, cleanEmail, data.origin);
      } else {
        await resetUserPassword(userRecord.uid, cleanEmail, data.origin);
      }
    } catch (emailErr) {
      console.error("[createUser] Warning: Failed to send initial welcome email:", emailErr);
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
    const snapshot = await adminDb.collection("users").orderBy("createdAt", "desc").get();
    const dbUsers = snapshot.docs.map((doc) => doc.data());

    const providerMap = new Map<string, string[]>();
    const googlePhotoMap = new Map<string, string>();
    try {
      const listUsersResult = await adminAuth.listUsers(1000);
      for (const authUser of listUsersResult.users) {
        const providers = authUser.providerData.map((p) => p.providerId);
        providerMap.set(authUser.uid, providers);

        let googleAvatar = authUser.photoURL || null;
        if (!googleAvatar && providers.includes("google.com") && authUser.email) {
          googleAvatar = `https://unavatar.io/google/${encodeURIComponent(authUser.email)}`;
        }
        if (googleAvatar) {
          googlePhotoMap.set(authUser.uid, googleAvatar);
        }
      }
    } catch (authErr) {
      console.warn("[getUsers] Failed to fetch auth providers:", authErr);
    }

    const users = (dbUsers || []).map((dbUser) => ({
      uid: dbUser.uid || dbUser.id,
      email: dbUser.email || "",
      firstName: dbUser.firstName || "",
      lastName: dbUser.lastName || "",
      role: dbUser.role || "client",
      createdAt: dbUser.createdAt || new Date().toISOString(),
      photoURL: dbUser.photoURL || "",
      socialMedia: dbUser.socialMedia || [],
      googlePhotoURL: googlePhotoMap.get(dbUser.uid || dbUser.id) || null,
      providers: providerMap.get(dbUser.uid || dbUser.id) || [],
    }));

    return { success: true, users };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateUser(
  uid: string,
  data: {
    firstName: string;
    lastName: string;
    role: string;
    photoURL?: string | null;
    socialMedia?: any[];
  },
) {
  try {
    await adminDb
      .collection("users")
      .doc(uid)
      .update({
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        photoURL: data.photoURL ?? null,
        socialMedia: data.socialMedia ?? [],
        updatedAt: new Date().toISOString(),
      });

    try {
      await adminAuth.updateUser(uid, {
        displayName: `${data.firstName} ${data.lastName}`.trim(),
      });
    } catch (authError: any) {
      console.error("[updateUser] Warning: Auth update failed:", authError.message);
    }

    revalidatePath("/dashboard/admin/users");
    revalidatePath(`/dashboard/admin/users/${uid}`);
    revalidatePath(`/dashboard/admin/users/${uid}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update user:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteUser(uid: string) {
  try {
    try {
      await adminAuth.deleteUser(uid);
    } catch (authError: any) {
      console.error("[deleteUser] Warning: Auth delete failed:", authError.message);
    }

    await adminDb.collection("users").doc(uid).delete();

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getUser(uid: string) {
  try {
    const docSnap = await adminDb.collection("users").doc(uid).get();

    if (!docSnap.exists) return { success: false, error: "User not found" };
    const dbUser = docSnap.data()!;

    let googlePhotoURL: string | null = null;
    let providers: string[] = [];

    try {
      const authUser = await adminAuth.getUser(uid);
      providers = authUser.providerData.map((p) => p.providerId);
      googlePhotoURL = authUser.photoURL || null;
      if (!googlePhotoURL && providers.includes("google.com") && (dbUser.email || authUser.email)) {
        googlePhotoURL = `https://unavatar.io/google/${encodeURIComponent(dbUser.email || authUser.email || "")}`;
      }
    } catch (authErr) {
      console.warn("[getUser] Could not fetch auth user details:", authErr);
    }

    const user = {
      uid: dbUser.uid || uid,
      email: dbUser.email || "",
      firstName: dbUser.firstName || "",
      lastName: dbUser.lastName || "",
      role: dbUser.role || "client",
      createdAt: dbUser.createdAt || new Date().toISOString(),
      photoURL: dbUser.photoURL || "",
      socialMedia: dbUser.socialMedia || [],
      googlePhotoURL,
      providers,
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
    const link = await adminAuth.generatePasswordResetLink(email, {
      url: `${origin}/auth/v1/reset-password`,
    });
    return { success: true, link };
  } catch (error) {
    console.error("Failed to generate recovery link:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function sendClientSetupEmail(_uid: string, email: string, origin: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const link = await adminAuth.generatePasswordResetLink(email, {
      url: `${origin}/auth/v1/client-setup`,
    });

    const { error: resendError } = await resend.emails.send({
      from: "Prestige Advisors <noreply@contact.bereanadvisorgroup.com>",
      to: email,
      subject: "Set Up Your Client Portal",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome to Prestige Advisors</h2>
          <p>Hello,</p>
          <p>A client portal account has been created for you. Click the button below to set up your account and choose how you want to log in:</p>
          <div style="margin: 30px 0;">
            <a href="${link}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Set Up Account</a>
          </div>
          <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
          <br />
          <p style="color: #666; font-size: 14px;">Or, copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${link}</p>
        </div>
      `,
    });

    if (resendError) throw new Error(resendError.message);

    return { success: true };
  } catch (error) {
    console.error("Failed to send client setup email:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getAdvisors() {
  try {
    const snapshot = await adminDb.collection("users").where("role", "in", ["admin", "advisor"]).get();

    const advisors = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: data.uid || doc.id,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        role: data.role,
      };
    });

    advisors.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.trim().toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return { success: true, advisors };
  } catch (error) {
    console.error("Failed to fetch advisors:", error);
    return { success: false, error: (error as { message: string }).message, advisors: [] };
  }
}
