import { notFound } from "next/navigation";

import { Database } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getFinancialAccountTypes } from "@/actions/financial-account-types";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { getRecordKeepers, unlinkClientFromRecordKeeper } from "@/actions/record-keepers";
import { RecordKeeperAccountsManager } from "@/app/(main)/dashboard/crm/clients/[id]/record-keepers/_components/record-keeper-accounts-manager";
import { AssociationCardList } from "@/components/crm/association-card-list";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HouseholdRecordKeepersPage({ params }: Props) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;
  const [allClientsRes, recordRes, typesRes] = await Promise.all([
    getClients(),
    getRecordKeepers(),
    getFinancialAccountTypes(),
  ]);

  const allClients = allClientsRes.success ? allClientsRes.clients || [] : [];
  const activeClients = allClients.filter((c) => clientIds.includes(c.id || ""));

  const recordKeepers = ((recordRes.success && recordRes.recordKeepers) || [])
    .map((rk) => ({ id: rk.id as string, name: rk.firmName as string }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const financialTypes = ((typesRes.success && typesRes.types) || []).map((t) => ({
    id: t.id as string,
    name: t.name,
  }));

  return (
    <div className="space-y-6 py-4">
      <HouseholdHeaderPortal sectionName="Record Keepers" />
      {activeClients.length > 0 ? (
        activeClients.map((client) => (
          <div key={client.id} className="space-y-2">
            <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              Client: {client.person ? `${client.person.firstName} ${client.person.lastName}` : client.id}
            </h3>
            <RecordKeeperAccountsManager
              client={client}
              recordKeepers={recordKeepers}
              financialTypes={financialTypes}
            />
          </div>
        ))
      ) : (
        <AssociationCardList
          entityId={id}
          title="Associated Record Keepers"
          description="No active financial rollup clients in this household."
          items={[]}
          linkPrefix="/dashboard/crm/record-keepers"
          icon={Database}
          onUnlinkAction={unlinkClientFromRecordKeeper}
          noCard={true}
        />
      )}
    </div>
  );
}
