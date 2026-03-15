"use server";

import { revalidatePath } from "next/cache";

import { adminDb } from "@/lib/firebase.server";
import { type Lawyer, LawyerSchema } from "@/types/crm";

const COLLECTION = "lawyers";

export async function getLawyers() {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const snapshot = await adminDb.collection(COLLECTION).get();
    const lawyers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Lawyer[];

    // Fetch person and address details
    const personIds = Array.from(new Set(lawyers.map((l) => l.personId)));
    const addressIds = Array.from(new Set(lawyers.map((l) => l.firmAddressId).filter(Boolean))) as string[];

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

    const lawyersWithDetails = lawyers.map((lawyer) => ({
      ...lawyer,
      person: peopleMap[lawyer.personId] || null,
      address: lawyer.firmAddressId ? addressMap[lawyer.firmAddressId] : null,
    }));

    return { success: true, lawyers: lawyersWithDetails };
  } catch (error: any) {
    console.error(`[getLawyers] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function getLawyer(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const doc = await adminDb.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return { success: false, error: "Lawyer not found" };

    const lawyer = { id: doc.id, ...doc.data() } as Lawyer;

    // Fetch person details
    const personDoc = await adminDb.collection("people").doc(lawyer.personId).get();
    const person = personDoc.exists ? { id: personDoc.id, ...personDoc.data() } : null;

    // Fetch address details
    let address = null;
    if (lawyer.firmAddressId) {
      const addressDoc = await adminDb.collection("addresses").doc(lawyer.firmAddressId).get();
      address = addressDoc.exists ? { id: addressDoc.id, ...addressDoc.data() } : null;
    }

    return { success: true, lawyer, person, address };
  } catch (error: any) {
    console.error(`[getLawyer] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function createLawyer(data: Partial<Lawyer>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const validated = LawyerSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const docRef = await adminDb.collection(COLLECTION).add(validated);
    revalidatePath("/dashboard/crm/lawyers");
    
    if (data.clientIds?.length) {
      data.clientIds.forEach(id => revalidatePath(`/dashboard/crm/clients/${id}`));
    }

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error(`[createLawyer] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function updateLawyer(id: string, data: Partial<Lawyer>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection(COLLECTION).doc(id).set(updateData, { merge: true });
    revalidatePath("/dashboard/crm/lawyers");
    revalidatePath(`/dashboard/crm/lawyers/${id}`);
    
    if (data.clientIds?.length) {
      data.clientIds.forEach(clientId => revalidatePath(`/dashboard/crm/clients/${clientId}`));
    }

    return { success: true };
  } catch (error: any) {
    console.error(`[updateLawyer] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function deleteLawyer(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const doc = await adminDb.collection(COLLECTION).doc(id).get();
    const lawyer = doc.data() as Lawyer | undefined;

    await adminDb.collection(COLLECTION).doc(id).delete();
    revalidatePath("/dashboard/crm/lawyers");
    
    if (lawyer?.clientIds?.length) {
      lawyer.clientIds.forEach(clientId => revalidatePath(`/dashboard/crm/clients/${clientId}`));
    }

    return { success: true };
  } catch (error: any) {
    console.error(`[deleteLawyer] Error:`, error);
    return { success: false, error: error.message };
  }
}
