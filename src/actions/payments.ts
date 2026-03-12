"use server";

import { adminDb } from "@/lib/firebase.server";
import { ClientPolicy, PaymentSchedule } from "@/types/crm";

export interface ScheduledPayment {
  policyId: string;
  clientName: string;
  policyName: string;
  policyNumber: string;
  carrierName: string;
  premiumTotal: number;
  paymentAmount: number;
  paymentDate: string;
  paymentSchedule: PaymentSchedule;
}

export async function getPaymentsForMonth(month: number, year: number) {
  try {
    if (!adminDb) throw new Error("Firebase admin not configured");

    const snapshot = await adminDb.collection("client-policies").get();
    const policies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (ClientPolicy & { id: string })[];

    const payments: ScheduledPayment[] = [];

    // Fetch dependencies
    const clientIds = Array.from(new Set(policies.map(p => p.clientId)));
    const companyIds = Array.from(new Set(policies.map(p => p.insuranceCompanyId)));

    const [clientDocs, companyDocs] = await Promise.all([
      Promise.all(clientIds.map(id => adminDb!.collection("clients").doc(id).get())),
      Promise.all(companyIds.map(id => adminDb!.collection("insurance-companies").doc(id).get()))
    ]);

    const clientsMap: any = {};
    for (const doc of clientDocs) {
      if (doc.exists) {
        const clientData = doc.data();
        const personDoc = await adminDb!.collection("people").doc(clientData!.personId).get();
        clientsMap[doc.id] = { ...clientData, person: personDoc.exists ? personDoc.data() : null };
      }
    }

    const companiesMap = companyDocs.reduce((acc, doc) => {
      if (doc.exists) acc[doc.id] = doc.data();
      return acc;
    }, {} as any);

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    for (const policy of policies) {
      const effectiveDate = new Date(policy.effectiveDate);
      const schedule = policy.paymentSchedule;
      const client = clientsMap[policy.clientId];
      const company = companiesMap[policy.insuranceCompanyId];

      // Calculate payment months based on schedule
      const paymentMonths: number[] = []; // 0-indexed months offset from effective month
      let interval = 1;
      let paymentAmount = policy.premiumAmount;

      switch (schedule) {
        case "monthly":
          interval = 1;
          paymentAmount = policy.premiumAmount / 12;
          break;
        case "quarterly":
          interval = 3;
          paymentAmount = policy.premiumAmount / 4;
          break;
        case "semi-annually":
          interval = 6;
          paymentAmount = policy.premiumAmount / 2;
          break;
        case "annually":
          interval = 12;
          paymentAmount = policy.premiumAmount;
          break;
      }

      // Check if this policy has a payment in the requested month/year
      // We look for any payment date: effectiveDate + N * interval months
      let currentPaymentDate = new Date(effectiveDate);
      
      // Safety break to avoid infinite loops
      let count = 0;
      while (currentPaymentDate <= endDate && count < 600) { // 50 years max
        if (
          currentPaymentDate.getMonth() === month &&
          currentPaymentDate.getFullYear() === year &&
          currentPaymentDate >= effectiveDate
        ) {
          payments.push({
            policyId: policy.id,
            clientName: client?.person ? `${client.person.firstName} ${client.person.lastName}` : "Unknown Client",
            policyName: policy.policyName,
            policyNumber: policy.policyNumber,
            carrierName: company?.name || "Unknown Carrier",
            premiumTotal: policy.premiumAmount,
            paymentAmount: Math.round(paymentAmount * 100) / 100,
            paymentDate: currentPaymentDate.toISOString().split('T')[0],
            paymentSchedule: schedule
          });
          break; // Found the payment for this month
        }
        currentPaymentDate.setMonth(currentPaymentDate.getMonth() + interval);
        count++;
      }
    }

    return { success: true, payments: payments.sort((a, b) => a.paymentDate.localeCompare(b.paymentDate)) };
  } catch (error: any) {
    console.error(`[getPaymentsForMonth] Error:`, error);
    return { success: false, error: error.message };
  }
}
