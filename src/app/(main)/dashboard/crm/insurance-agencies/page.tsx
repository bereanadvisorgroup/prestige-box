import { AlertCircle } from "lucide-react";

import { getInsuranceAgencies } from "@/actions/insurance-agencies";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { InsuranceAgenciesTable } from "./_components/insurance-agencies-table";

export const dynamic = "force-dynamic";

export default async function InsuranceAgenciesPage() {
  const result = await getInsuranceAgencies();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Insurance Agencies</h1>
          <p className="mt-2 text-muted-foreground">Manage insurance agency contacts.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch insurance agencies from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawInsuranceAgencies = result.insuranceAgencies || [];
  const insuranceAgencies = rawInsuranceAgencies.map((agency: any) => ({
    ...agency,
    isLinked: agency.clientIds && agency.clientIds.length > 0,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <InsuranceAgenciesTable data={insuranceAgencies} />
    </div>
  );
}
