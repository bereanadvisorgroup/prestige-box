import { AlertCircle } from "lucide-react";

import { getPropertyAndCasualtyFirms } from "@/actions/property-and-casualty";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { PropertyAndCasualtyTable } from "./_components/property-and-casualty-table";

export default async function PropertyAndCasualtyPage() {
  const result = await getPropertyAndCasualtyFirms();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Property And Casualty</h1>
          <p className="mt-2 text-muted-foreground">Manage property and casualty firms.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch firms from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawFirms = result.propertyAndCasualtyFirms || [];
  const firms = rawFirms.map((firm) => ({
    ...firm,
    isLinked: firm.clientIds && firm.clientIds.length > 0,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <PropertyAndCasualtyTable data={firms} />
    </div>
  );
}
