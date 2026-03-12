import Link from "next/link";
import { Plus, Shield, AlertCircle } from "lucide-react";

import { getInsuranceCompanies } from "@/actions/insurance-companies";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CompaniesTable } from "./_components/companies-table";

export default async function InsuranceCompaniesPage() {
  const result = await getInsuranceCompanies();

  if (!result.success) {
    return (
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insurance Companies</h1>
          <p className="text-muted-foreground mt-2">Manage insurance carriers and their supported policy types.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch insurance companies from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const companies = result.companies || [];

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Insurance Companies</h1>
          <p className="text-muted-foreground mt-2">
            Configure carriers and the products they offer.
          </p>
        </div>
        <Button asChild className="font-semibold">
          <Link href="/dashboard/admin/insurance-companies/new">
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
