import { notFound } from "next/navigation";

import { ReceiptText } from "lucide-react";

import { getAccountingFirms, unlinkClientFromAccountingFirm } from "@/actions/accounting-firms";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HouseholdAccountingFirmsPage({ params }: Props) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;
  const accountingFirmsRes = await getAccountingFirms();
  const allFirms = (accountingFirmsRes.success && accountingFirmsRes.accountingFirms) || [];

  const associatedAccountingFirms = allFirms.filter((a) => a.clientIds?.some((cId: string) => clientIds.includes(cId)));

  return (
    <div className="py-4">
      <HouseholdHeaderPortal sectionName="Accounting Firms" />
      <AssociationCardList
        entityId={clientIds[0] || id}
        title="Associated Accounting Firms"
        description="Accounting firms associated with household members in active financial rollup"
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
