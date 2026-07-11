import { AlertCircle } from "lucide-react";

import { getCompanies, getCompaniesLinkStatus } from "@/actions/companies";
import { getAdvisors } from "@/actions/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { CompaniesTable } from "./_components/companies-table";

export default async function CompaniesPage() {
  const [result, linkResult, advisorsRes] = await Promise.all([
    getCompanies(),
    getCompaniesLinkStatus(),
    getAdvisors(),
  ]);

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
  const linkedCompanyIds = linkResult.success ? linkResult.linkedCompanyIds || new Set() : new Set();
  const advisors = advisorsRes.success && advisorsRes.advisors ? advisorsRes.advisors : [];
  const advisorNameById = new Map(
    advisors.map((a) => [a.uid, `${a.firstName} ${a.lastName}`.trim() || a.uid] as const),
  );

  const companies = rawCompanies.map((company) => ({
    ...company,
    isLinked: linkedCompanyIds.has(company.id),
    advisorName: company.advisorId ? (advisorNameById.get(company.advisorId) ?? null) : null,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <CompaniesTable data={companies} />
    </div>
  );
}
