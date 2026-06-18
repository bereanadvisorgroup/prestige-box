import { AlertCircle } from "lucide-react";

import { getBanks } from "@/actions/banks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { BanksTable } from "./_components/banks-table";

export default async function BanksPage() {
  const result = await getBanks();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Banks</h1>
          <p className="mt-2 text-muted-foreground">Manage banks and banking contacts.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch banks from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawBanks = result.banks || [];
  const banks = rawBanks.map((bank) => ({
    ...bank,
    isLinked: bank.clientIds && bank.clientIds.length > 0,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <BanksTable data={banks} />
    </div>
  );
}
