"use server";

import { revalidatePath } from "next/cache";

import { adminAuth, adminDb } from "@/lib/firebase.server";

export async function createUser(data: {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
}) {
  try {
    if (!adminAuth || !adminDb) {
      throw new Error("Server not properly configured. Firebase admin is missing.");
    }

    // 1. Create User in Firebase Auth
    // Use the provided password, or a random fallback to satisfy Auth requirements
    const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    const authRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password || randomPassword,
      displayName: `${data.firstName} ${data.lastName}`.trim(),
    });

    // 2. Create User Profile Document in Firestore
    const userProfile = {
      uid: authRecord.uid,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      createdAt: new Date().toISOString(),
    };

    await adminDb.collection("users").doc(authRecord.uid).set(userProfile);

    // Optional: Revalidate the users page cache
    revalidatePath("/dashboard/admin/users");

    return { success: true, user: userProfile };
  } catch (error: unknown) {
    console.error("Failed to create user:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getUsers() {
  try {
    if (!adminAuth || !adminDb) {
      throw new Error("Server not properly configured. Firebase admin is missing.");
    }

    // 1. Fetch users from Firebase Auth
    const authList = await adminAuth.listUsers();

    // 2. Fetch all user profiles from Firestore
    let firestoreUsers = new Map<string, any>();
    try {
      const snapshot = await adminDb.collection("users").get();
      firestoreUsers = new Map(snapshot.docs.map((doc) => [doc.id, doc.data()]));
    } catch (fsError: any) {
      console.error("[getUsers] Optional Firestore profile fetch failed:", fsError.message);
    }

    // 3. Merge profiles
    const users = authList.users.map((authUser) => {
      const dbUser = firestoreUsers.get(authUser.uid) || {};

      return {
        uid: authUser.uid,
        email: authUser.email || dbUser.email || "",
        firstName: dbUser.firstName || authUser.displayName?.split(" ")[0] || "",
        lastName: dbUser.lastName || authUser.displayName?.split(" ").slice(1).join(" ") || "",
        role: dbUser.role || "client",
        createdAt: dbUser.createdAt || authUser.metadata.creationTime || new Date().toISOString(),
        photoURL: authUser.photoURL || dbUser.photoURL || "",
      };
    });

    return { success: true, users };
  } catch (error: unknown) {
    console.error("Failed to fetch users:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateUser(uid: string, data: { firstName: string; lastName: string; role: string }) {
  try {
    if (!adminDb) throw new Error("Server not properly configured. Firebase admin is missing.");

    // Update Document in Firestore
    await adminDb.collection("users").doc(uid).set(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        uid, // Ensure UID is in the doc
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update user:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteUser(uid: string) {
  try {
    if (!adminAuth || !adminDb) throw new Error("Server not properly configured. Firebase admin is missing.");

    // 1. Delete from Firebase Auth
    await adminAuth.deleteUser(uid);

    // 2. Delete Profile Document in Firestore
    await adminDb.collection("users").doc(uid).delete();

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete user:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getUser(uid: string) {
  try {
    if (!adminAuth || !adminDb) {
      throw new Error("Server not properly configured. Firebase admin is missing.");
    }

    // 1. Fetch user from Firebase Auth
    const authUser = await adminAuth.getUser(uid);

    // 2. Fetch user profile from Firestore
    let dbUser: any = {};
    try {
      const doc = await adminDb.collection("users").doc(uid).get();
      dbUser = doc.exists ? doc.data() || {} : {};
    } catch (fsError: any) {
      console.error("[getUser] Optional Firestore profile fetch failed:", fsError.message);
    }

    // 3. Merge profile
    const user = {
      uid: authUser.uid,
      email: authUser.email || dbUser.email || "",
      firstName: dbUser.firstName || authUser.displayName?.split(" ")[0] || "",
      lastName: dbUser.lastName || authUser.displayName?.split(" ").slice(1).join(" ") || "",
      role: dbUser.role || "client",
      createdAt: dbUser.createdAt || authUser.metadata.creationTime || new Date().toISOString(),
      photoURL: authUser.photoURL || dbUser.photoURL || "",
    };

    return { success: true, user };
  } catch (error: unknown) {
    console.error("Failed to fetch user:", error);
    return { success: false, error: (error as Error).message };
  }
}
