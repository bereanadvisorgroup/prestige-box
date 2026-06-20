import { notFound } from "next/navigation";

import { TrendingUp } from "lucide-react";

import { getClient } from "@/actions/clients";
import { getMoneyManagers, linkClientToMoneyManager, unlinkClientFromMoneyManager } from "@/actions/money-managers";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { LinkFirmDialog } from "@/components/crm/link-firm-dialog";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MoneyManagersPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const moneyRes = await getMoneyManagers();
  const allManagers = (moneyRes.success && moneyRes.moneyManagers) || [];

  const associatedMoneyManagers = allManagers.filter((mm) => mm.clientIds?.includes(client.id || ""));

  const availableFirms = allManagers
    .filter((mm) => !mm.clientIds?.includes(client.id || ""))
    .map((mm) => ({ id: mm.id || "", name: mm.firmName }));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <AssociationCardList
        clientId={client.id || ""}
        title="Associated Money Managers"
        description="Money managers this client is associated with"
        items={associatedMoneyManagers.map((mm) => ({
          id: mm.id || "",
          name: mm.firmName,
          website: mm.website,
          phone: mm.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/admin/money-managers"
        icon={TrendingUp}
        onUnlinkAction={unlinkClientFromMoneyManager}
        actionNode={
          <LinkFirmDialog
            clientId={client.id || ""}
            firmTypeLabel="Money Manager"
            availableFirms={availableFirms}
            newFirmLink={`/dashboard/admin/money-managers/new?clientId=${client.id}`}
            onLinkAction={linkClientToMoneyManager}
          />
        }
      />
    </div>
  );
}
