"use server";

import { revalidatePath } from "next/cache";

import { adminDb } from "@/lib/firebase.server";
import { type Accountant, AccountantSchema } from "@/types/crm";

const COLLECTION = "accountants";

export async function getAccountants() {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const snapshot = await adminDb.collection(COLLECTION).get();
    const accountants = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Accountant[];

    // Fetch person and address details
    const personIds = Array.from(new Set(accountants.map((a) => a.personId)));
    const addressIds = Array.from(new Set(accountants.map((a) => a.firmAddressId).filter(Boolean))) as string[];

    const [personDocs, addressDocs] = await Promise.all([
      personIds.length > 0 ? Promise.all(personIds.map((id) => adminDb!.collection("people").doc(id).get())) : [],
      addressIds.length > 0 ? Promise.all(addressIds.map((id) => adminDb!.collection("addresses").doc(id).get())) : [],
    ]);

    const peopleMap = personDocs.reduce((acc, doc) => {
      if (doc.exists) acc[doc.id] = { id: doc.id, ...doc.data() };
      return acc;
    }, {} as any);

    const addressMap = addressDocs.reduce((acc, doc) => {
      if (doc.exists) acc[doc.id] = { id: doc.id, ...doc.data() };
      return acc;
    }, {} as any);

    const accountantsWithDetails = accountants.map((accountant) => ({
      ...accountant,
      person: peopleMap[accountant.personId] || null,
      address: accountant.firmAddressId ? addressMap[accountant.firmAddressId] : null,
    }));

    return { success: true, accountants: accountantsWithDetails };
  } catch (error: any) {
    console.error(`[getAccountants] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function getAccountant(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const doc = await adminDb.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return { success: false, error: "Accountant not found" };

    const accountant = { id: doc.id, ...doc.data() } as Accountant;

    // Fetch person details
    const personDoc = await adminDb.collection("people").doc(accountant.personId).get();
    const person = personDoc.exists ? { id: personDoc.id, ...personDoc.data() } : null;

    // Fetch address details
    let address = null;
    if (accountant.firmAddressId) {
      const addressDoc = await adminDb.collection("addresses").doc(accountant.firmAddressId).get();
      address = addressDoc.exists ? { id: addressDoc.id, ...addressDoc.data() } : null;
    }

    return { success: true, accountant, person, address };
  } catch (error: any) {
    console.error(`[getAccountant] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function createAccountant(data: Partial<Accountant>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const validated = AccountantSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const docRef = await adminDb.collection(COLLECTION).add(validated);
    revalidatePath("/dashboard/crm/accountants");

    if (data.clientIds?.length) {
      data.clientIds.forEach((id) => revalidatePath(`/dashboard/crm/clients/${id}`));
    }

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error(`[createAccountant] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function updateAccountant(id: string, data: Partial<Accountant>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection(COLLECTION).doc(id).set(updateData, { merge: true });
    revalidatePath("/dashboard/crm/accountants");
    revalidatePath(`/dashboard/crm/accountants/${id}`);

    if (data.clientIds?.length) {
      data.clientIds.forEach((clientId) => revalidatePath(`/dashboard/crm/clients/${clientId}`));
    }

    return { success: true };
  } catch (error: any) {
    console.error(`[updateAccountant] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function deleteAccountant(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const doc = await adminDb.collection(COLLECTION).doc(id).get();
    const accountant = doc.data() as Accountant | undefined;

    await adminDb.collection(COLLECTION).doc(id).delete();
    revalidatePath("/dashboard/crm/accountants");

    if (accountant?.clientIds?.length) {
      accountant.clientIds.forEach((clientId) => revalidatePath(`/dashboard/crm/clients/${clientId}`));
    }

    return { success: true };
  } catch (error: any) {
    console.error(`[deleteAccountant] Error:`, error);
    return { success: false, error: error.message };
  }
}
