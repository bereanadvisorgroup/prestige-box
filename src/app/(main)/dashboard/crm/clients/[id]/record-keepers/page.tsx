import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";
import { getFinancialAccountTypes } from "@/actions/financial-account-types";
import { getRecordKeepers } from "@/actions/record-keepers";

import { RecordKeeperAccountsManager } from "./_components/record-keeper-accounts-manager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecordKeepersPage({ params }: Props) {
  const { id } = await params;
  const [clientResult, recordRes, typesRes] = await Promise.all([
    getClient(id),
    getRecordKeepers(),
    getFinancialAccountTypes(),
  ]);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;

  const recordKeepers = ((recordRes.success && recordRes.recordKeepers) || [])
    .map((rk) => ({ id: rk.id as string, name: rk.firmName as string }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const financialTypes = ((typesRes.success && typesRes.types) || []).map((t) => ({
    id: t.id as string,
    name: t.name,
  }));

  return (
    <div className="py-4">
      <RecordKeeperAccountsManager client={client} recordKeepers={recordKeepers} financialTypes={financialTypes} />
    </div>
  );
}
