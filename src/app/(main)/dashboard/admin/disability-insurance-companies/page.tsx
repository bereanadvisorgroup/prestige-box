import Link from "next/link";

import { AlertCircle, Plus } from "lucide-react";

import { getDisabilityInsuranceCompanies } from "@/actions/disability-insurance-companies";
import { getClientPolicies } from "@/actions/policies";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { CompaniesTable } from "./_components/companies-table";

export default async function DisabilityInsuranceCompaniesPage() {
  const [result, policiesRes] = await Promise.all([getDisabilityInsuranceCompanies(), getClientPolicies()]);

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Disability Insurance Companies</h1>
          <p className="mt-2 text-muted-foreground">
            Manage disability insurance carriers and their supported policy types.
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error ||
              "Failed to fetch disability insurance companies from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawCompanies = result.companies || [];
  const policies = policiesRes.success && policiesRes.policies ? policiesRes.policies : [];

  const companies = rawCompanies.map((company) => ({
    ...company,
    isLinked: policies.some((p) => p.disabilityInsuranceCompanyId === company.id),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-3xl text-primary tracking-tight">Disability Insurance Companies</h1>
          <p className="mt-2 text-muted-foreground">Configure carriers and the products they offer.</p>
        </div>
        <Button asChild className="font-semibold">
          <Link href="/dashboard/admin/disability-insurance-companies/new">
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
