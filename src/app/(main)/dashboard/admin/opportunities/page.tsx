import { AlertCircle } from "lucide-react";

import { getOpportunityPipelines } from "@/actions/opportunity-pipelines";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { PipelinesTable } from "./_components/pipelines-table";

export default async function OpportunitiesPage() {
  const result = await getOpportunityPipelines();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Opportunity Pipelines</h1>
          <p className="mt-2 text-muted-foreground">Manage opportunity pipelines.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch pipelines from the server. Check server logs."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const pipelines = result.pipelines || [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <PipelinesTable data={pipelines} />
    </div>
  );
}
