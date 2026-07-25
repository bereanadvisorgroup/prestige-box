import { notFound } from "next/navigation";

import { AlertCircle } from "lucide-react";

import { getEntityHistory } from "@/actions/history";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { HistoryTable } from "@/components/history/history-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ChangeHistoryWithEntity } from "@/types/crm";

import { HouseholdHeaderPortal } from "../../_components/household-header-portal";

interface HouseholdHistoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function HouseholdHistoryPage({ params }: HouseholdHistoryPageProps) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;
  const result = await getEntityHistory("client", clientIds);

  return (
    <div className="space-y-4 py-4">
      <HouseholdHeaderPortal sectionName="History" />

      {!result.success ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{result.error || "Failed to load history."}</AlertDescription>
        </Alert>
      ) : (
        <HistoryTable
          data={(result.history || []).map((h) => ({ ...h, entityName: null }) as ChangeHistoryWithEntity)}
        />
      )}
    </div>
  );
}
