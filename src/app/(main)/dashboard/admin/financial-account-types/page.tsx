import { AlertCircle } from "lucide-react";

import { getFinancialAccountTypes } from "@/actions/financial-account-types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { AccountTypesTable } from "./_components/account-types-table";

export default async function FinancialAccountTypesPage() {
  const result = await getFinancialAccountTypes();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Financial Account Types</h1>
          <p className="mt-2 text-muted-foreground">Manage financial account types.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch financial account types from the server. Check server logs."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawTypes = result.types || [];

  // As requested, delete is permitted only if there are no associated records.
  // Currently, no other entity table references financial_account_types.
  // In the future, once relationships are added, compute actual link constraints here.
  const types = rawTypes.map((type) => ({
    ...type,
    isLinked: false, // Defaulting to false as there are no associated records currently.
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <AccountTypesTable data={types} />
    </div>
  );
}
