import Link from "next/link";

import { AlertCircle, Plus } from "lucide-react";

import { getLawFirms } from "@/actions/law-firms";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { LawFirmsTable } from "./_components/law-firms-table";

export default async function LawFirmsPage() {
  const result = await getLawFirms();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Law Firms</h1>
          <p className="mt-2 text-muted-foreground">Manage law firms and legal contacts.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch law firms from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawLawFirms = result.lawFirms || [];
  const lawFirms = rawLawFirms.map((lawFirm) => ({
    ...lawFirm,
    isLinked: lawFirm.clientIds && lawFirm.clientIds.length > 0,
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Law Firms</h1>
          <p className="mt-2 text-muted-foreground">
            View and manage law firms and their associated legal professionals and clients.
          </p>
        </div>
        <Button asChild className="font-semibold shadow-sm">
          <Link href="/dashboard/crm/law-firms/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Law Firm
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <LawFirmsTable data={lawFirms} />
      </div>
    </div>
  );
}
