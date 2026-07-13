import { AlertCircle } from "lucide-react";

import { getEntityHistory } from "@/actions/history";
import { HistoryTable } from "@/components/history/history-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ChangeHistoryWithEntity } from "@/types/crm";

import { CompanyHeaderPortal } from "../../_components/company-header-portal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyHistoryPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getEntityHistory("company", id);

  return (
    <div className="flex flex-col gap-6 p-6">
      <CompanyHeaderPortal sectionName="History" />

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
