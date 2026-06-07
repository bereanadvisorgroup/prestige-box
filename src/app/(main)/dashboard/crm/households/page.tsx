import Link from "next/link";

import { AlertCircle, Plus } from "lucide-react";

import { getHouseholds } from "@/actions/households";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Households</h1>
          <p className="mt-2 text-muted-foreground">View, add, and manage household records and their members.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/crm/households/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Household
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <HouseholdsTable data={households} />
      </div>
    </div>
  );
}
