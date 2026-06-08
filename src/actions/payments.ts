"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase.server";
import type { PaymentSchedule } from "@/types/crm";

export interface ScheduledPayment {
  policyId: string;
  clientId: string;
  clientName: string;
  policyName: string;
  policyNumber: string;
  carrierName: string;
  paymentAccountName: string;
  premiumTotal: number;
  paymentAmount: number;
  paymentDate: string;
  paymentSchedule: PaymentSchedule;
}

export async function getPaymentsForMonth(month: number, year: number) {
  try {
    const { data: policies, error: policiesError } = await supabaseServer.from("client_policies").select("*");

    if (policiesError) throw new Error((policiesError as { message: string }).message);
    if (!policies || policies.length === 0) return { success: true, payments: [] };

    const payments: ScheduledPayment[] = [];

    // Fetch dependencies
    const clientIds = Array.from(new Set(policies.map((p) => p.clientId)));
    const companyIds = Array.from(new Set(policies.map((p) => p.insuranceCompanyId)));

    const [clientsResult, companiesResult] = await Promise.all([
      clientIds.length > 0
        ? supabaseServer.from("clients").select("*").in("id", clientIds)
        : Promise.resolve({ data: [] as never[], error: null as PostgrestError | null }),
      companyIds.length > 0
        ? supabaseServer.from("insurance_companies").select("*").in("id", companyIds)
        : Promise.resolve({ data: [] as never[], error: null as PostgrestError | null }),
    ]);

    if (clientsResult.error) throw new Error(clientsResult.error.message);
    if (companiesResult.error) throw new Error(companiesResult.error.message);

    const clients = clientsResult.data || [];
    const companies = companiesResult.data || [];

    const personIds = Array.from(new Set(clients.map((c) => c.personId)));
    let peopleMap: Record<string, Record<string, unknown>> = {};
    if (personIds.length > 0) {
      const { data: people, error: peopleError } = await supabaseServer.from("people").select("*").in("id", personIds);
      if (peopleError) throw new Error((peopleError as { message: string }).message);
      peopleMap = (people || []).reduce(
        (acc, p) => {
          acc[p.id] = p;
          return acc;
        },
        {} as Record<string, (typeof people)[number]>,
      );
    }

    const clientsMap: Record<string, (typeof clients)[number] & { person: Record<string, unknown> | null }> = {};
    for (const client of clients) {
      clientsMap[client.id] = {
        ...client,
        person: (peopleMap[client.personId] as Record<string, unknown>) || null,
      };
    }

    const companiesMap = companies.reduce(
      (acc, doc) => {
        acc[doc.id] = doc;
        return acc;
      },
      {} as Record<string, (typeof companies)[number]>,
    );

    const endDate = new Date(year, month + 1, 0);

    for (const policy of policies) {
      const effectiveDate = new Date(policy.effectiveDate);
      const schedule = policy.paymentSchedule;
      const client = clientsMap[policy.clientId];
      const company = companiesMap[policy.insuranceCompanyId];

      // Calculate payment months based on schedule
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
      const currentPaymentDate = new Date(effectiveDate);

      // Safety break to avoid infinite loops
      let count = 0;
      while (currentPaymentDate <= endDate && count < 600) {
        if (
          currentPaymentDate.getMonth() === month &&
          currentPaymentDate.getFullYear() === year &&
          currentPaymentDate >= effectiveDate
        ) {
          const clientPayments = (client?.paymentAccounts || []) as { id: string; name: string }[];
          const paymentAccountName = policy.paymentAccountId
            ? clientPayments.find((a) => a.id === policy.paymentAccountId)?.name || "Unknown Account"
            : "No Account Selected";

          const clientPerson = client?.person as { firstName?: string; lastName?: string } | null;
          const clientName = clientPerson
            ? `${clientPerson.firstName || ""} ${clientPerson.lastName || ""}`.trim()
            : "Unknown Client";

          payments.push({
            policyId: policy.id,
            clientId: policy.clientId,
            clientName,
            policyName: policy.policyName,
            policyNumber: policy.policyNumber,
            carrierName: company?.name || "Unknown Carrier",
            paymentAccountName,
            premiumTotal: policy.premiumAmount,
            paymentAmount: Math.round(paymentAmount * 100) / 100,
            paymentDate: currentPaymentDate.toISOString().split("T")[0],
            paymentSchedule: schedule as PaymentSchedule,
          });
          break; // Found the payment for this month
        }
        currentPaymentDate.setMonth(currentPaymentDate.getMonth() + interval);
        count++;
      }
    }

    return { success: true, payments: payments.sort((a, b) => a.paymentDate.localeCompare(b.paymentDate)) };
  } catch (error) {
    console.error(`[getPaymentsForMonth] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
