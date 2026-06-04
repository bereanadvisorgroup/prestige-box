import Link from "next/link";

import { AlertCircle, GraduationCap, Plus } from "lucide-react";

import { getLawyers } from "@/actions/lawyers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { LawyersTable } from "./_components/lawyers-table";

export default async function LawyersPage() {
  const result = await getLawyers();

  if (!result.success) {
    return (
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lawyers</h1>
          <p className="text-muted-foreground mt-2">Manage legal professional contacts.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch lawyers from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawLawyers = result.lawyers || [];
  const lawyers = rawLawyers.map((lawyer) => ({
    ...lawyer,
    isLinked: lawyer.clientIds && lawyer.clientIds.length > 0,
  }));

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lawyers</h1>
          <p className="text-muted-foreground mt-2">
            View and manage legal professionals and their associated firms and clients.
          </p>
        </div>
        <Button asChild className="font-semibold shadow-sm">
          <Link href="/dashboard/crm/lawyers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Lawyer
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <LawyersTable data={lawyers} />
      </div>
    </div>
  );
}
