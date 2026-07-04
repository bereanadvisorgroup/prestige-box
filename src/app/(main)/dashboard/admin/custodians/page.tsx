import { AlertCircle } from "lucide-react";

import { getCustodians } from "@/actions/custodians";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { CustodiansTable } from "./_components/custodians-table";

export default async function CustodiansPage() {
  const result = await getCustodians();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Custodians</h1>
          <p className="mt-2 text-muted-foreground">Manage custodians.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch custodians from the server. Check server logs."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawList = result.custodians || [];

  // Delete is permitted only if there are no associated records.
  // Initially, there are no references to the custodians table.
  const custodians = rawList.map((custodian) => ({
    ...custodian,
    isLinked: false, // Defaulting to false since no entities link to custodians yet.
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <CustodiansTable data={custodians} />
    </div>
  );
}
