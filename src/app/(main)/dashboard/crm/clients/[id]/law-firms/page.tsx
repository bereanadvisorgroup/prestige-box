import { notFound } from "next/navigation";

import { Scale } from "lucide-react";

import { getClient } from "@/actions/clients";
import { getLawFirms, linkClientToLawFirm, unlinkClientFromLawFirm } from "@/actions/law-firms";
import { AssociationCardList } from "@/components/features/crm/association-card-list";
import { LinkFirmDialog } from "@/components/features/crm/link-firm-dialog";

import { ClientHeaderPortal } from "../_components/client-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LawFirmsPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const lawFirmsRes = await getLawFirms();
  const allFirms = (lawFirmsRes.success && lawFirmsRes.lawFirms) || [];

  const associatedLawFirms = allFirms.filter((l) => l.clientIds?.includes(client.id || ""));

  const availableFirms = allFirms
    .filter((l) => !l.clientIds?.includes(client.id || ""))
    .map((l) => ({ id: l.id || "", name: l.firmName }));

  return (
    <div className="py-4">
      <ClientHeaderPortal sectionName="Law Firms">
        <LinkFirmDialog
          entityId={client.id || ""}
          firmTypeLabel="Law Firm"
          availableFirms={availableFirms}
          newFirmLink={`/dashboard/crm/law-firms/new?clientId=${client.id}`}
          onLinkAction={linkClientToLawFirm}
        />
      </ClientHeaderPortal>
      <AssociationCardList
        entityId={client.id || ""}
        title="Associated Law Firms"
        description="Law firms this client is associated with"
        items={associatedLawFirms.map((f) => ({
          id: f.id || "",
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/crm/law-firms"
        icon={Scale}
        onUnlinkAction={unlinkClientFromLawFirm}
        noCard={true}
      />
    </div>
  );
}
