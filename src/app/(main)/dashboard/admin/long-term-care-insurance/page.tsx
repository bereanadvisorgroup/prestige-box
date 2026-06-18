import { AlertCircle } from "lucide-react";

import { getLongTermCareInsurances } from "@/actions/long-term-care-insurance";
import { getClientPolicies } from "@/actions/policies";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { InsuranceTable } from "./_components/insurance-table";

export default async function LongTermCareInsurancePage() {
  const [result, policiesRes] = await Promise.all([getLongTermCareInsurances(), getClientPolicies()]);

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Long Term Care Insurance</h1>
          <p className="mt-2 text-muted-foreground">
            Manage Long Term Care insurance carriers and their supported policy types.
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error ||
              "Failed to fetch long term care insurance carriers from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawCompanies = result.companies || [];
  const policies = policiesRes.success && policiesRes.policies ? policiesRes.policies : [];

  const companies = rawCompanies.map((company) => ({
    ...company,
    isLinked: policies.some((p) => p.longTermCareInsuranceId === company.id),
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <InsuranceTable data={companies} />
    </div>
  );
}
