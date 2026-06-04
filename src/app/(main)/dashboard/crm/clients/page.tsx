import Link from "next/link";

import { AlertCircle, Plus } from "lucide-react";

import { getAccountants } from "@/actions/accountants";
import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getLawyers } from "@/actions/lawyers";
import { getClientPolicies } from "@/actions/policies";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { ClientsTable } from "./_components/clients-table";

export default async function ClientsPage() {
  const [clientsRes, policiesRes, lawyersRes, accountantsRes, companiesRes] = await Promise.all([
    getClients(),
    getClientPolicies(),
    getLawyers(),
    getAccountants(),
    getCompanies(),
  ]);

  if (!clientsRes.success) {
    return (
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-2">Manage extended client profiles for CRM engagement.</p>
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
  const lawyers = lawyersRes.success && lawyersRes.lawyers ? lawyersRes.lawyers : [];
  const accountants = accountantsRes.success && accountantsRes.accountants ? accountantsRes.accountants : [];
  const companies = companiesRes.success && companiesRes.companies ? companiesRes.companies : [];

  const clients = rawClients.map((client) => {
    const isLinked =
      policies.some((p) => p.clientId === client.id) ||
      lawyers.some((l) => l.clientIds?.includes(client.id!)) ||
      accountants.some((a) => a.clientIds?.includes(client.id!)) ||
      companies.some((comp) => comp.clientIds?.includes(client.id!));

    return {
      ...client,
      isLinked,
    };
  });

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-2">
            View and manage interests and engagement details for your client base.
          </p>
        </div>
        <Button asChild className="font-semibold shadow-sm">
          <Link href="/dashboard/crm/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Client Record
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <ClientsTable data={clients} />
      </div>
    </div>
  );
}
