"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase.server";
import { Person, PersonSchema } from "@/types/crm";

const COLLECTION = "people";

export async function getPeople() {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const snapshot = await adminDb.collection(COLLECTION).orderBy("lastName", "asc").get();
    const people = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Person[];

    return { success: true, people };
  } catch (error: any) {
    console.error(`[getPeople] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function getPerson(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const doc = await adminDb.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return { success: false, error: "Person not found" };

    const person = { id: doc.id, ...doc.data() } as Person;
    return { success: true, person };
  } catch (error: any) {
    console.error(`[getPerson] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function createPerson(data: Partial<Person>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const validated = PersonSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const docRef = await adminDb.collection(COLLECTION).add(validated);
    revalidatePath("/dashboard/crm/people");

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error(`[createPerson] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function updatePerson(id: string, data: Partial<Person>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection(COLLECTION).doc(id).set(updateData, { merge: true });
    revalidatePath("/dashboard/crm/people");
    revalidatePath(`/dashboard/crm/people/${id}`);

    return { success: true };
  } catch (error: any) {
    console.error(`[updatePerson] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function deletePerson(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    await adminDb.collection(COLLECTION).doc(id).delete();
    revalidatePath("/dashboard/crm/people");

    return { success: true };
  } catch (error: any) {
    console.error(`[deletePerson] Error:`, error);
    return { success: false, error: error.message };
  }
}
