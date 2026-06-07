import Link from "next/link";

import { AlertCircle, Plus } from "lucide-react";

import { getCompanies } from "@/actions/companies";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { CompaniesTable } from "./_components/companies-table";

export default async function CompaniesPage() {
  const result = await getCompanies();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Companies</h1>
          <p className="mt-2 text-muted-foreground">Manage companies associated with your clients.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch companies from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawCompanies = result.companies || [];
  const companies = rawCompanies.map((company) => ({
    ...company,
    isLinked: company.clientIds && company.clientIds.length > 0,
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Companies</h1>
          <p className="mt-2 text-muted-foreground">View and manage companies associated with client records.</p>
        </div>
        <Button asChild className="font-semibold shadow-sm">
          <Link href="/dashboard/crm/companies/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <CompaniesTable data={companies} />
      </div>
    </div>
  );
}
