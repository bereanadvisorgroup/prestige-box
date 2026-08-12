import { AlertCircle } from "lucide-react";

import { getAccountingFirms } from "@/actions/accounting-firms";
import { getActuarialFirms } from "@/actions/actuarial-firms";
import { getBanks } from "@/actions/banks";
import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getInsuranceAgencies } from "@/actions/insurance-agencies";
import { getLawFirms } from "@/actions/law-firms";
import { getClientPolicies } from "@/actions/policies";
import { getPropertyAndCasualtyFirms } from "@/actions/property-and-casualty";
import { getAdvisors } from "@/actions/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { ClientsTable } from "./_components/clients-table";

export default async function ClientsPage() {
  const [
    clientsRes,
    policiesRes,
    lawFirmsRes,
    accountingFirmsRes,
    insuranceAgenciesRes,
    actuarialFirmsRes,
    banksRes,
    propertyAndCasualtyFirmsRes,
    companiesRes,
    advisorsRes,
  ] = await Promise.all([
    getClients(),
    getClientPolicies(),
    getLawFirms(),
    getAccountingFirms(),
    getInsuranceAgencies(),
    getActuarialFirms(),
    getBanks(),
    getPropertyAndCasualtyFirms(),
    getCompanies(),
    getAdvisors(),
  ]);

  if (!clientsRes.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Clients</h1>
          <p className="mt-2 text-muted-foreground">Manage extended client profiles for CRM engagement.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {clientsRes.error || "Failed to fetch clients from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawClients = clientsRes.clients || [];
  const policies = policiesRes.success && policiesRes.policies ? policiesRes.policies : [];
  const lawFirms = lawFirmsRes.success && lawFirmsRes.lawFirms ? lawFirmsRes.lawFirms : [];
  const accountingFirms =
    accountingFirmsRes.success && accountingFirmsRes.accountingFirms ? accountingFirmsRes.accountingFirms : [];
  const insuranceAgencies =
    insuranceAgenciesRes.success && insuranceAgenciesRes.insuranceAgencies
      ? insuranceAgenciesRes.insuranceAgencies
      : [];
  const actuarialFirms =
    actuarialFirmsRes.success && actuarialFirmsRes.actuarialFirms ? actuarialFirmsRes.actuarialFirms : [];
  const banks = banksRes.success && banksRes.banks ? banksRes.banks : [];
  const propertyAndCasualtyFirms =
    propertyAndCasualtyFirmsRes.success && propertyAndCasualtyFirmsRes.propertyAndCasualtyFirms
      ? propertyAndCasualtyFirmsRes.propertyAndCasualtyFirms
      : [];
  const companies = companiesRes.success && companiesRes.companies ? companiesRes.companies : [];
  const advisors = advisorsRes.success && advisorsRes.advisors ? advisorsRes.advisors : [];
  const advisorNameById = new Map(
    advisors.map((a) => [a.uid, `${a.firstName} ${a.lastName}`.trim() || a.uid] as const),
  );

  const clients = rawClients.map((client: any) => {
    const isLinked =
      policies.some((p: any) => p.clientId === client.id) ||
      lawFirms.some((l: any) => l.clientIds?.includes(client.id!)) ||
      accountingFirms.some((a: any) => a.clientIds?.includes(client.id!)) ||
      insuranceAgencies.some((ia: any) => ia.clientIds?.includes(client.id!)) ||
      actuarialFirms.some((act: any) => act.clientIds?.includes(client.id!)) ||
      banks.some((b: any) => b.clientIds?.includes(client.id!)) ||
      propertyAndCasualtyFirms.some((pc: any) => pc.clientIds?.includes(client.id!)) ||
      companies.some((comp: any) => comp.clientIds?.includes(client.id!));

    return {
      ...client,
      isLinked,
      advisorName: client.advisorId ? (advisorNameById.get(client.advisorId) ?? null) : null,
    };
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <ClientsTable data={clients} />
    </div>
  );
}
