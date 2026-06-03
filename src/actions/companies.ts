"use server";

import { revalidatePath } from "next/cache";

import { adminDb } from "@/lib/firebase.server";
import { type Company, CompanySchema } from "@/types/crm";

const COLLECTION = "companies";

export async function getCompanies() {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const snapshot = await adminDb.collection(COLLECTION).get();
    const companies = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Company[];

    return { success: true, companies };
  } catch (error: any) {
    console.error(`[getCompanies] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function getCompaniesByClient(clientId: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const snapshot = await adminDb.collection(COLLECTION).where("clientIds", "array-contains", clientId).get();

    const companies = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Company[];

    return { success: true, companies };
  } catch (error: any) {
    console.error(`[getCompaniesByClient] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function getCompany(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const doc = await adminDb.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return { success: false, error: "Company not found" };

    const company = { id: doc.id, ...doc.data() } as Company;

    // We can fetch address here if needed, or handle it on the client side

    return { success: true, company };
  } catch (error: any) {
    console.error(`[getCompany] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function createCompany(data: Partial<Company>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const validated = CompanySchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const docRef = await adminDb.collection(COLLECTION).add(validated);
    revalidatePath("/dashboard/crm/companies");
    if (data.clientIds?.length) {
      data.clientIds.forEach((id) => revalidatePath(`/dashboard/crm/clients/${id}`));
    }

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error(`[createCompany] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function updateCompany(id: string, data: Partial<Company>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection(COLLECTION).doc(id).set(updateData, { merge: true });
    revalidatePath("/dashboard/crm/companies");
    revalidatePath(`/dashboard/crm/companies/${id}`);

    // Attempting to revalidate any clients that might be affected
    if (data.clientIds?.length) {
      data.clientIds.forEach((clientId) => revalidatePath(`/dashboard/crm/clients/${clientId}`));
    }

    return { success: true };
  } catch (error: any) {
    console.error(`[updateCompany] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function deleteCompany(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const doc = await adminDb.collection(COLLECTION).doc(id).get();
    const company = doc.data() as Company | undefined;

    await adminDb.collection(COLLECTION).doc(id).delete();
    revalidatePath("/dashboard/crm/companies");

    if (company?.clientIds?.length) {
      company.clientIds.forEach((clientId) => revalidatePath(`/dashboard/crm/clients/${clientId}`));
    }

    return { success: true };
  } catch (error: any) {
    console.error(`[deleteCompany] Error:`, error);
    return { success: false, error: error.message };
  }
}
