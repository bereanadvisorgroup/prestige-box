import { AlertCircle } from "lucide-react";

import { getReferralTypes } from "@/actions/referral-types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { ReferralTypesTable } from "./_components/referral-types-table";

export default async function ReferralTypesPage() {
  const result = await getReferralTypes();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Referral Types</h1>
          <p className="mt-2 text-muted-foreground">Manage referral types.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch referral types from the server. Check server logs."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawList = result.referralTypes || [];

  // Delete is permitted only if there are no associated records.
  // Initially, there are no references to the referral_types table.
  const referralTypes = rawList.map((rt) => ({
    ...rt,
    isLinked: false, // Defaulting to false since no entities link to referral types yet.
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <ReferralTypesTable data={referralTypes} />
    </div>
  );
}
