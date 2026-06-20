import { notFound } from "next/navigation";

import { Building2, Calculator } from "lucide-react";

import { getActuarialFirms, linkClientToActuarialFirm, unlinkClientFromActuarialFirm } from "@/actions/actuarial-firms";
import { getClient } from "@/actions/clients";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { LinkFirmDialog } from "@/components/crm/link-firm-dialog";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ActuarialFirmsPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const actuarialFirmsRes = await getActuarialFirms();
  const allFirms = (actuarialFirmsRes.success && actuarialFirmsRes.actuarialFirms) || [];

  const associatedActuarialFirms = allFirms.filter((act) => act.clientIds?.includes(client.id || ""));

  const availableFirms = allFirms
    .filter((act) => !act.clientIds?.includes(client.id || ""))
    .map((act) => ({ id: act.id || "", name: act.firmName }));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <AssociationCardList
        clientId={client.id || ""}
        title="Associated Actuarial Firms"
        description="Actuarial firms this client is associated with"
        items={associatedActuarialFirms.map((f) => ({
          id: f.id || "",
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/crm/actuarial-firms"
        icon={Calculator}
        onUnlinkAction={unlinkClientFromActuarialFirm}
        actionNode={
          <LinkFirmDialog
            clientId={client.id || ""}
            firmTypeLabel="Actuarial Firm"
            availableFirms={availableFirms}
            newFirmLink={`/dashboard/crm/actuarial-firms/new?clientId=${client.id}`}
            onLinkAction={linkClientToActuarialFirm}
          />
        }
      />
    </div>
  );
}
