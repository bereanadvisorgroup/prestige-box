"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase.server";
import { InsuranceCompany, InsuranceCompanySchema } from "@/types/crm";

const COLLECTION = "insurance-companies";

export async function getInsuranceCompanies() {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const snapshot = await adminDb.collection(COLLECTION).orderBy("name", "asc").get();
    const companies = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InsuranceCompany[];

    return { success: true, companies };
  } catch (error: any) {
    console.error(`[getInsuranceCompanies] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function getInsuranceCompany(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const doc = await adminDb.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return { success: false, error: "Insurance Company not found" };

    const company = { id: doc.id, ...doc.data() } as InsuranceCompany;
    return { success: true, company };
  } catch (error: any) {
    console.error(`[getInsuranceCompany] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function createInsuranceCompany(data: Partial<InsuranceCompany>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const validated = InsuranceCompanySchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const docRef = await adminDb.collection(COLLECTION).add(validated);
    revalidatePath("/dashboard/admin/insurance-companies");

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error(`[createInsuranceCompany] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function updateInsuranceCompany(id: string, data: Partial<InsuranceCompany>) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection(COLLECTION).doc(id).set(updateData, { merge: true });
    revalidatePath("/dashboard/admin/insurance-companies");
    revalidatePath(`/dashboard/admin/insurance-companies/${id}`);

    return { success: true };
  } catch (error: any) {
    console.error(`[updateInsuranceCompany] Error:`, error);
    return { success: false, error: error.message };
  }
}

export async function deleteInsuranceCompany(id: string) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    await adminDb.collection(COLLECTION).doc(id).delete();
    revalidatePath("/dashboard/admin/insurance-companies");

    return { success: true };
  } catch (error: any) {
    console.error(`[deleteInsuranceCompany] Error:`, error);
    return { success: false, error: error.message };
  }
}
