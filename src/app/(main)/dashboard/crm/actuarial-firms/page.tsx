import { AlertCircle } from "lucide-react";

import { getActuarialFirms } from "@/actions/actuarial-firms";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { ActuarialFirmsTable } from "./_components/actuarial-firms-table";

export default async function ActuarialFirmsPage() {
  const result = await getActuarialFirms();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Actuarial Firms</h1>
          <p className="mt-2 text-muted-foreground">Manage actuarial firms and risk contacts.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch actuarial firms from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawActuarialFirms = result.actuarialFirms || [];
  const actuarialFirms = rawActuarialFirms.map((actuarialFirm) => ({
    ...actuarialFirm,
    isLinked: actuarialFirm.clientIds && actuarialFirm.clientIds.length > 0,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <ActuarialFirmsTable data={actuarialFirms} />
    </div>
  );
}
