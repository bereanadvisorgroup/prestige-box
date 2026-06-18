import { AlertCircle } from "lucide-react";

import { getRecordKeepers } from "@/actions/record-keepers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { RecordKeepersTable } from "./_components/record-keepers-table";

export default async function RecordKeepersPage() {
  const result = await getRecordKeepers();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Record Keepers</h1>
          <p className="mt-2 text-muted-foreground">Manage record keepers and retirement/benefit plan contacts.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch record keepers from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawRecordKeepers = result.recordKeepers || [];
  const recordKeepers = rawRecordKeepers.map((rk) => ({
    ...rk,
    isLinked: rk.clientIds && rk.clientIds.length > 0,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <RecordKeepersTable data={recordKeepers} />
    </div>
  );
}
