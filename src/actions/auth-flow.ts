"use server";

import { adminAuth, adminDb } from "@/lib/firebase.server";

async function getAuthUserByEmail(email: string) {
  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    return userRecord || null;
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === "auth/user-not-found") {
      return null;
    }
    throw error;
  }
}

export async function checkUserStatus(email: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if email exists in users collection in Firestore
    const snapshot = await adminDb.collection("users").where("email", "==", cleanEmail).limit(1).get();

    if (snapshot.empty) {
      return { success: true, status: "no_account" as const };
    }

    // 2. Check if user exists in Firebase Auth
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

    // 1. Verify whitelisting in Firestore
    const snapshot = await adminDb.collection("users").where("email", "==", cleanEmail).limit(1).get();

    if (snapshot.empty) {
      return { success: false, error: "You do not have an account, please contact our office for assistance." };
    }

    const dbUserDoc = snapshot.docs[0];
    const dbUser = dbUserDoc.data();

    // 2. Verify no existing auth record
    const authUser = await getAuthUserByEmail(cleanEmail);
    if (authUser) {
      return { success: false, error: "An account already exists for this email address. Please sign in." };
    }

    // 3. Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: cleanEmail,
      password: data.password,
      displayName: `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim(),
    });

    // Update uid in users collection document
    await dbUserDoc.ref.update({
      uid: userRecord.uid,
      updatedAt: new Date().toISOString(),
    });

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
    const snapshot = await adminDb.collection("users").where("email", "==", cleanEmail).limit(1).get();

    if (snapshot.empty) {
      return { success: false, error: "You do not have an account, please contact our office for assistance." };
    }

    const dbUserDoc = snapshot.docs[0];
    const dbUser = dbUserDoc.data();

    // 2. Verify no existing auth record
    const authUser = await getAuthUserByEmail(cleanEmail);
    if (authUser) {
      return { success: false, error: "An account already exists for this email address. Please sign in." };
    }

    // 3. Create auth user with temporary random password
    const tempPassword = `${Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)}A1!`;
    const userRecord = await adminAuth.createUser({
      email: cleanEmail,
      password: tempPassword,
      displayName: `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim(),
    });

    await dbUserDoc.ref.update({
      uid: userRecord.uid,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, tempPassword };
  } catch (error) {
    console.error("Passkey registration initialization error:", error);
    return { success: false, error: (error as Error).message };
  }
}
