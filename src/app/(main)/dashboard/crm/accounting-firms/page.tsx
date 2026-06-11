import Link from "next/link";

import { AlertCircle, Plus } from "lucide-react";

import { getAccountingFirms } from "@/actions/accounting-firms";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { AccountingFirmsTable } from "./_components/accounting-firms-table";

export const dynamic = "force-dynamic";

export default async function AccountingFirmsPage() {
  const result = await getAccountingFirms();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Accounting Firms</h1>
          <p className="mt-2 text-muted-foreground">Manage accounting firm contacts.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch accounting firms from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawAccountingFirms = result.accountingFirms || [];
  const accountingFirms = rawAccountingFirms.map((accountingFirm) => ({
    ...accountingFirm,
    isLinked: accountingFirm.clientIds && accountingFirm.clientIds.length > 0,
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Accounting Firms</h1>
          <p className="mt-2 text-muted-foreground">
            View and manage accounting firms and their associated professionals and clients.
          </p>
        </div>
        <Button asChild className="font-semibold shadow-sm">
          <Link href="/dashboard/crm/accounting-firms/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Accounting Firm
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <AccountingFirmsTable data={accountingFirms} />
      </div>
    </div>
  );
}
