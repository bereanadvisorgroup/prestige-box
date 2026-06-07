import Link from "next/link";

import { AlertCircle, Plus } from "lucide-react";

import { getClientPolicies } from "@/actions/policies";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Client Policies</h1>
          <p className="mt-2 text-muted-foreground">View and manage active insurance coverage for all clients.</p>
        </div>
        <Button asChild className="font-semibold shadow-sm">
          <Link href="/dashboard/crm/policies/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Policy
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <PoliciesTable data={policies} />
      </div>
    </div>
  );
}
