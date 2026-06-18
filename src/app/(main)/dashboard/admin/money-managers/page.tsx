import { AlertCircle } from "lucide-react";

import { getMoneyManagers } from "@/actions/money-managers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { MoneyManagersTable } from "./_components/money-managers-table";

export default async function MoneyManagersPage() {
  const result = await getMoneyManagers();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Money Managers</h1>
          <p className="mt-2 text-muted-foreground">Manage money managers and wealth contacts.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch money managers from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawMoneyManagers = result.moneyManagers || [];
  const moneyManagers = rawMoneyManagers.map((mm) => ({
    ...mm,
    isLinked: mm.clientIds && mm.clientIds.length > 0,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <MoneyManagersTable data={moneyManagers} />
    </div>
  );
}
