"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase.server";
import { ClientPolicy, ClientPolicySchema } from "@/types/crm";

const COLLECTION = "client-policies";

export async function getClientPolicies() {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const snapshot = await adminDb.collection(COLLECTION).orderBy("createdAt", "desc").get();
    const policies = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (ClientPolicy & { id: string })[];

    // Enrich with client and company data
    const enrichedPolicies = await Promise.all(
      policies.map(async (policy) => {
        const [clientDoc, companyDoc] = await Promise.all([
          adminDb!.collection("clients").doc(policy.clientId).get(),
          adminDb!.collection("insurance-companies").doc(policy.insuranceCompanyId).get(),
        ]);

        let clientName = "Unknown Client";
        if (clientDoc.exists) {
          const clientData = clientDoc.data();
          const personDoc = await adminDb!.collection("people").doc(clientData!.personId).get();
          if (personDoc.exists) {
            const personData = personDoc.data();
            clientName = `${personData!.firstName} ${personData!.lastName}`;
          }
        }

        return {
          ...policy,
          clientName,
          carrierName: companyDoc.exists ? companyDoc.data()!.name : "Unknown Carrier",
        };
      })
    );

    return { success: true, policies: enrichedPolicies };
  } catch (error: any) {
    console.error(`[getClientPolicies] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function getClientPolicy(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const doc = await adminDb.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return { success: false, error: "Policy not found" };

    const policy = { id: doc.id, ...doc.data() } as ClientPolicy;
    return { success: true, policy };
  } catch (error: any) {
    console.error(`[getClientPolicy] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function createClientPolicy(data: Partial<ClientPolicy>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const validated = ClientPolicySchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const docRef = await adminDb.collection(COLLECTION).add(validated);
    revalidatePath("/dashboard/crm/policies");

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error(`[createClientPolicy] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function updateClientPolicy(id: string, data: Partial<ClientPolicy>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection(COLLECTION).doc(id).set(updateData, { merge: true });
    revalidatePath("/dashboard/crm/policies");
    revalidatePath(`/dashboard/crm/policies/${id}`);

    return { success: true };
  } catch (error: any) {
    console.error(`[updateClientPolicy] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function deleteClientPolicy(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    await adminDb.collection(COLLECTION).doc(id).delete();
    revalidatePath("/dashboard/crm/policies");

    return { success: true };
  } catch (error: any) {
    console.error(`[deleteClientPolicy] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function getClientPoliciesByClient(clientId: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const snapshot = await adminDb.collection(COLLECTION).where("clientId", "==", clientId).get();
    const policies = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (ClientPolicy & { id: string })[];

    return { success: true, policies };
  } catch (error: any) {
    console.error(`[getClientPoliciesByClient] Error:`, error);
    return { success: false, error: error.message };
  }
}
