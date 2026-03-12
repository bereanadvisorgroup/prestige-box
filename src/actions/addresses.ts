"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase.server";
import { Address, AddressSchema } from "@/types/crm";

const COLLECTION = "addresses";

export async function getAddresses() {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const snapshot = await adminDb.collection(COLLECTION).orderBy("street1", "asc").get();
    const addresses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Address[];

    return { success: true, addresses };
  } catch (error: any) {
    console.error(`[getAddresses] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function getAddress(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const doc = await adminDb.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return { success: false, error: "Address not found" };

    const address = { id: doc.id, ...doc.data() } as Address;
    return { success: true, address };
  } catch (error: any) {
    console.error(`[getAddress] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function createAddress(data: Partial<Address>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const validated = AddressSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const docRef = await adminDb.collection(COLLECTION).add(validated);
    revalidatePath("/dashboard/crm/addresses");

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error(`[createAddress] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function updateAddress(id: string, data: Partial<Address>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const updateData = {
      ...data,
    };

    await adminDb.collection(COLLECTION).doc(id).set(updateData, { merge: true });
    revalidatePath("/dashboard/crm/addresses");
    revalidatePath(`/dashboard/crm/addresses/${id}`);

    return { success: true };
  } catch (error: any) {
    console.error(`[updateAddress] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function deleteAddress(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    // Check if any people are linked to this address
    const peopleSnapshot = await adminDb.collection("people")
      .where("addressIds", "array-contains", id)
      .limit(1)
      .get();
    
    if (!peopleSnapshot.empty) {
      throw new Error("Cannot delete address that is linked to people");
    }

    await adminDb.collection(COLLECTION).doc(id).delete();
    revalidatePath("/dashboard/crm/addresses");

    return { success: true };
  } catch (error: any) {
    console.error(`[deleteAddress] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function getAddressPeople(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const snapshot = await adminDb.collection("people")
      .where("addressIds", "array-contains", id)
      .get();
    
    const people = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, people };
  } catch (error: any) {
    console.error(`[getAddressPeople] Error:`, error);
    return { success: false, error: error.message };
  }
}
