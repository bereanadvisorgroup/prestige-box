import { notFound } from "next/navigation";

import { Building2, ReceiptText } from "lucide-react";

import {
  getAccountingFirms,
  linkClientToAccountingFirm,
  unlinkClientFromAccountingFirm,
} from "@/actions/accounting-firms";
import { getClient } from "@/actions/clients";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { LinkFirmDialog } from "@/components/crm/link-firm-dialog";

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
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <AssociationCardList
        clientId={client.id || ""}
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
        actionNode={
          <LinkFirmDialog
            clientId={client.id || ""}
            firmTypeLabel="Accounting Firm"
            availableFirms={availableFirms}
            newFirmLink={`/dashboard/crm/accounting-firms/new?clientId=${client.id}`}
            onLinkAction={linkClientToAccountingFirm}
          />
        }
      />
    </div>
  );
}
