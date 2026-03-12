import Link from "next/link";
import { Plus, FileText, AlertCircle } from "lucide-react";

import { getClientPolicies } from "@/actions/policies";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PoliciesTable } from "./_components/policies-table";

export default async function PoliciesPage() {
  const result = await getClientPolicies();

  if (!result.success) {
    return (
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Policies</h1>
          <p className="text-muted-foreground mt-2">Manage insurance policies and coverage details.</p>
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
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Policies</h1>
          <p className="text-muted-foreground mt-2">
            View and manage active insurance coverage for all clients.
          </p>
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
