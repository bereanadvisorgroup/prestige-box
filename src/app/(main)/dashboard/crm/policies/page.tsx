import { AlertCircle } from "lucide-react";

import { getClientPolicies } from "@/actions/policies";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { PoliciesTable } from "./_components/policies-table";

export default async function PoliciesPage() {
  const result = await getClientPolicies();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Client Policies</h1>
          <p className="mt-2 text-muted-foreground">Manage insurance policies and coverage details.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch policies from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const policies = result.policies || [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <PoliciesTable data={policies} />
    </div>
  );
}
