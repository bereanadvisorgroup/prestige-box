"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase.server";
import { Household, HouseholdSchema } from "@/types/crm";

const COLLECTION = "households";

export async function getHouseholds() {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const snapshot = await adminDb.collection(COLLECTION).orderBy("name", "asc").get();
    const households = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Household[];

    return { success: true, households };
  } catch (error: any) {
    console.error(`[getHouseholds] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function getHousehold(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const doc = await adminDb.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return { success: false, error: "Household not found" };

    const household = { id: doc.id, ...doc.data() } as Household;

    // Fetch details for address and members
    const addressDoc = await adminDb.collection("addresses").doc(household.addressId).get();
    const address = addressDoc.exists ? { id: addressDoc.id, ...addressDoc.data() } : null;

    const memberPromises = household.memberIds.map(m => adminDb!.collection("people").doc(m.personId).get());
    const memberDocs = await Promise.all(memberPromises);
    const members = memberDocs.map((doc, index) => ({
      person: doc.exists ? { id: doc.id, ...doc.data() } : null,
      role: household.memberIds[index].role
    }));

    return { success: true, household, address, members };
  } catch (error: any) {
    console.error(`[getHousehold] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function createHousehold(data: Partial<Household>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const validated = HouseholdSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const docRef = await adminDb.collection(COLLECTION).add(validated);
    revalidatePath("/dashboard/crm/households");

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error(`[createHousehold] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function updateHousehold(id: string, data: Partial<Household>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection(COLLECTION).doc(id).set(updateData, { merge: true });
    revalidatePath("/dashboard/crm/households");
    revalidatePath(`/dashboard/crm/households/${id}`);

    return { success: true };
  } catch (error: any) {
    console.error(`[updateHousehold] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function deleteHousehold(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    await adminDb.collection(COLLECTION).doc(id).delete();
    revalidatePath("/dashboard/crm/households");

    return { success: true };
  } catch (error: any) {
    console.error(`[deleteHousehold] Error:`, error);
    return { success: false, error: error.message };
  }
}
