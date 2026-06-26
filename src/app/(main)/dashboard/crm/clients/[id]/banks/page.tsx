import { notFound } from "next/navigation";

import { Building2, Landmark } from "lucide-react";

import { getBanks, linkClientToBank, unlinkClientFromBank } from "@/actions/banks";
import { getClient } from "@/actions/clients";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { LinkFirmDialog } from "@/components/crm/link-firm-dialog";

import { PaymentAccountsSection } from "../_components/payment-accounts-section";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BanksPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const banksRes = await getBanks();
  const allFirms = (banksRes.success && banksRes.banks) || [];

  const associatedBanks = allFirms.filter((b) => b.clientIds?.includes(client.id || ""));

  const availableFirms = allFirms
    .filter((b) => !b.clientIds?.includes(client.id || ""))
    .map((b) => ({ id: b.id || "", name: b.firmName }));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <AssociationCardList
            entityId={client.id || ""}
            title="Associated Banks"
            description="Banks this client is associated with"
            items={associatedBanks.map((f) => ({
              id: f.id || "",
              name: f.firmName,
              website: f.website,
              phone: f.phone,
              isLinked:
                client.paymentAccounts?.some((p) => p.bankId === f.id) ||
                client.liabilities?.some((l) => l.bankId === f.id) ||
                false,
            }))}
            linkPrefix="/dashboard/crm/banks"
            icon={Landmark}
            onUnlinkAction={unlinkClientFromBank}
            actionNode={
              <LinkFirmDialog
                entityId={client.id || ""}
                firmTypeLabel="Bank"
                availableFirms={availableFirms}
                newFirmLink={`/dashboard/crm/banks/new?clientId=${client.id}`}
                onLinkAction={linkClientToBank}
              />
            }
          />

          {/* Moved Payment Accounts Section */}
          <PaymentAccountsSection client={client} associatedBanks={associatedBanks as any} />
        </div>
      </div>
    </div>
  );
}
