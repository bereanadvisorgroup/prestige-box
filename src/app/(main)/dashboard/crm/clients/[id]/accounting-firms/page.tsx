import { notFound } from "next/navigation";

import { ReceiptText } from "lucide-react";

import {
  getAccountingFirms,
  linkClientToAccountingFirm,
  unlinkClientFromAccountingFirm,
} from "@/actions/accounting-firms";
import { getClient } from "@/actions/clients";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { LinkFirmDialog } from "@/components/crm/link-firm-dialog";

import { ClientHeaderPortal } from "../_components/client-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AccountingFirmsPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const accountingFirmsRes = await getAccountingFirms();
  const allFirms = (accountingFirmsRes.success && accountingFirmsRes.accountingFirms) || [];

  const associatedAccountingFirms = allFirms.filter((a) => a.clientIds?.includes(client.id || ""));

  const availableFirms = allFirms
    .filter((a) => !a.clientIds?.includes(client.id || ""))
    .map((a) => ({ id: a.id || "", name: a.firmName }));

  return (
    <div className="py-4">
      <ClientHeaderPortal sectionName="Accounting Firms">
        <LinkFirmDialog
          entityId={client.id || ""}
          firmTypeLabel="Accounting Firm"
          availableFirms={availableFirms}
          newFirmLink={`/dashboard/crm/accounting-firms/new?clientId=${client.id}`}
          onLinkAction={linkClientToAccountingFirm}
        />
      </ClientHeaderPortal>
      <AssociationCardList
        entityId={client.id || ""}
        title="Associated Accounting Firms"
        description="Accounting firms this client is associated with"
        items={associatedAccountingFirms.map((f) => ({
          id: f.id || "",
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/crm/accounting-firms"
        icon={ReceiptText}
        onUnlinkAction={unlinkClientFromAccountingFirm}
        noCard={true}
      />
    </div>
  );
}
