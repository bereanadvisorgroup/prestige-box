"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase.server";
import { Client, ClientSchema } from "@/types/crm";

const COLLECTION = "clients";

export async function getClients() {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const snapshot = await adminDb.collection(COLLECTION).get();
    const clients = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Client[];

    // Fetch person details for each client
    const personIds = Array.from(new Set(clients.map(c => c.personId)));
    if (personIds.length === 0) return { success: true, clients: [] };

    const personDocs = await Promise.all(
      personIds.map(id => adminDb!.collection("people").doc(id).get())
    );
    
    const peopleMap = personDocs.reduce((acc, doc) => {
      if (doc.exists) acc[doc.id] = doc.data();
      return acc;
    }, {} as any);

    const clientWithPeople = clients.map(client => ({
      ...client,
      person: peopleMap[client.personId] || null
    }));

    return { success: true, clients: clientWithPeople };
  } catch (error: any) {
    console.error(`[getClients] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function getClient(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const doc = await adminDb.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return { success: false, error: "Client not found" };

    const client = { id: doc.id, ...doc.data() } as Client;

    // Fetch person details
    const personDoc = await adminDb.collection("people").doc(client.personId).get();
    const person = personDoc.exists ? { id: personDoc.id, ...personDoc.data() } : null;

    return { success: true, client, person };
  } catch (error: any) {
    console.error(`[getClient] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function createClient(data: Partial<Client>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    // Check if client for this person already exists
    const existing = await adminDb.collection(COLLECTION).where("personId", "==", data.personId).limit(1).get();
    if (!existing.empty) {
      throw new Error("A client record already exists for this person");
    }

    const validated = ClientSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const docRef = await adminDb.collection(COLLECTION).add(validated);
    revalidatePath("/dashboard/crm/clients");

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error(`[createClient] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function updateClient(id: string, data: Partial<Client>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection(COLLECTION).doc(id).set(updateData, { merge: true });
    revalidatePath("/dashboard/crm/clients");
    revalidatePath(`/dashboard/crm/clients/${id}`);

    return { success: true };
  } catch (error: any) {
    console.error(`[updateClient] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function deleteClient(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    await adminDb.collection(COLLECTION).doc(id).delete();
    revalidatePath("/dashboard/crm/clients");

    return { success: true };
  } catch (error: any) {
    console.error(`[deleteClient] Error:`, error);
    return { success: false, error: error.message };
  }
}
