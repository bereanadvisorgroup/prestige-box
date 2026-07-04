import { notFound } from "next/navigation";

import { Database } from "lucide-react";

import { getClient } from "@/actions/clients";
import { getRecordKeepers, linkClientToRecordKeeper, unlinkClientFromRecordKeeper } from "@/actions/record-keepers";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { LinkFirmDialog } from "@/components/crm/link-firm-dialog";

import { ClientHeaderPortal } from "../_components/client-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecordKeepersPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const recordRes = await getRecordKeepers();
  const allKeepers = (recordRes.success && recordRes.recordKeepers) || [];

  const associatedRecordKeepers = allKeepers.filter((rk) => rk.clientIds?.includes(client.id || ""));

  const availableFirms = allKeepers
    .filter((rk) => !rk.clientIds?.includes(client.id || ""))
    .map((rk) => ({ id: rk.id || "", name: rk.firmName }));

  return (
    <div className="py-4">
      <ClientHeaderPortal sectionName="Record Keepers">
        <LinkFirmDialog
          entityId={client.id || ""}
          firmTypeLabel="Record Keeper"
          availableFirms={availableFirms}
          newFirmLink={`/dashboard/admin/record-keepers/new?clientId=${client.id}`}
          onLinkAction={linkClientToRecordKeeper}
        />
      </ClientHeaderPortal>
      <AssociationCardList
        entityId={client.id || ""}
        title="Associated Record Keepers"
        description="Record keepers this client is associated with"
        items={associatedRecordKeepers.map((rk) => ({
          id: rk.id || "",
          name: rk.firmName,
          website: rk.website,
          phone: rk.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/admin/record-keepers"
        icon={Database}
        onUnlinkAction={unlinkClientFromRecordKeeper}
        noCard={true}
      />
    </div>
  );
}
