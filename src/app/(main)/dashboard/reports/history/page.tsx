import { AlertCircle, Clock } from "lucide-react";

import { getAllHistory } from "@/actions/history";
import { HistoryTable } from "@/components/features/history/history-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "History Report | Prestige Box",
};

export default async function HistoryReportPage() {
  const result = await getAllHistory();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{result.error || "Failed to load history records."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const history = result.history || [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">History Report</h1>
          <p className="mt-2 text-muted-foreground">Search and review every change made to clients and companies.</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1 font-mono text-[10px]">
          <Clock className="h-3 w-3" />
          {history.length} RECORDS
        </Badge>
      </div>

      <HistoryTable data={history} showEntity />
    </div>
  );
}
