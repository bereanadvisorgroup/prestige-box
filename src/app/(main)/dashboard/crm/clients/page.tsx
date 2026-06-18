import { AlertCircle } from "lucide-react";

import { getAccountingFirms } from "@/actions/accounting-firms";
import { getActuarialFirms } from "@/actions/actuarial-firms";
import { getBanks } from "@/actions/banks";
import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getLawFirms } from "@/actions/law-firms";
import { getClientPolicies } from "@/actions/policies";
import { getPropertyAndCasualtyFirms } from "@/actions/property-and-casualty";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { ClientsTable } from "./_components/clients-table";

export default async function ClientsPage() {
  const [
    clientsRes,
    policiesRes,
    lawFirmsRes,
    accountingFirmsRes,
    actuarialFirmsRes,
    banksRes,
    propertyAndCasualtyFirmsRes,
    companiesRes,
  ] = await Promise.all([
    getClients(),
    getClientPolicies(),
    getLawFirms(),
    getAccountingFirms(),
    getActuarialFirms(),
    getBanks(),
    getPropertyAndCasualtyFirms(),
    getCompanies(),
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
  const actuarialFirms =
    actuarialFirmsRes.success && actuarialFirmsRes.actuarialFirms ? actuarialFirmsRes.actuarialFirms : [];
  const banks = banksRes.success && banksRes.banks ? banksRes.banks : [];
  const propertyAndCasualtyFirms =
    propertyAndCasualtyFirmsRes.success && propertyAndCasualtyFirmsRes.propertyAndCasualtyFirms
      ? propertyAndCasualtyFirmsRes.propertyAndCasualtyFirms
      : [];
  const companies = companiesRes.success && companiesRes.companies ? companiesRes.companies : [];

  const clients = rawClients.map((client) => {
    const isLinked =
      policies.some((p) => p.clientId === client.id) ||
      lawFirms.some((l) => l.clientIds?.includes(client.id!)) ||
      accountingFirms.some((a) => a.clientIds?.includes(client.id!)) ||
      actuarialFirms.some((act) => act.clientIds?.includes(client.id!)) ||
      banks.some((b) => b.clientIds?.includes(client.id!)) ||
      propertyAndCasualtyFirms.some((pc) => pc.clientIds?.includes(client.id!)) ||
      companies.some((comp) => comp.clientIds?.includes(client.id!));

    return {
      ...client,
      isLinked,
    };
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <ClientsTable data={clients} />
    </div>
  );
}
