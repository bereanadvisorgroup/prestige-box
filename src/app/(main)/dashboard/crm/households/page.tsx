import { AlertCircle } from "lucide-react";

import { getHouseholds } from "@/actions/households";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { HouseholdsTable } from "./_components/households-table";

export default async function HouseholdsPage() {
  const result = await getHouseholds();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Households</h1>
          <p className="mt-2 text-muted-foreground">Manage household groups in the system.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch households from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const households = result.households || [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <HouseholdsTable data={households} />
    </div>
  );
}
