import Link from "next/link";

import { AlertCircle, Plus } from "lucide-react";

import { getAccountants } from "@/actions/accountants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { AccountantsTable } from "./_components/accountants-table";

export default async function AccountantsPage() {
  const result = await getAccountants();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Accountants</h1>
          <p className="mt-2 text-muted-foreground">Manage accounting professional contacts.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch accountants from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawAccountants = result.accountants || [];
  const accountants = rawAccountants.map((accountant) => ({
    ...accountant,
    isLinked: accountant.clientIds && accountant.clientIds.length > 0,
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Accountants</h1>
          <p className="mt-2 text-muted-foreground">
            View and manage accounting professionals and their associated firms and clients.
          </p>
        </div>
        <Button asChild className="font-semibold shadow-sm">
          <Link href="/dashboard/crm/accountants/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Accountant
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <AccountantsTable data={accountants} />
      </div>
    </div>
  );
}
