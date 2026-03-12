import Link from "next/link";
import { Plus, Users, AlertCircle } from "lucide-react";

import { getHouseholds } from "@/actions/households";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HouseholdsTable } from "./_components/households-table";

export default async function HouseholdsPage() {
  const result = await getHouseholds();

  if (!result.success) {
    return (
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Households</h1>
          <p className="text-muted-foreground mt-2">Manage household groups in the system.</p>
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
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Households</h1>
          <p className="text-muted-foreground mt-2">
            View, add, and manage household records and their members.
          </p>
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
