import { notFound } from "next/navigation";

import { Landmark } from "lucide-react";

import { getBanks, unlinkClientFromBank } from "@/actions/banks";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HouseholdBanksPage({ params }: Props) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;
  const banksRes = await getBanks();
  const allFirms = (banksRes.success && banksRes.banks) || [];

  const associatedBanks = allFirms.filter((b) => b.clientIds?.some((cId: string) => clientIds.includes(cId)));

  return (
    <div className="py-4">
      <HouseholdHeaderPortal sectionName="Banks" />
      <AssociationCardList
        entityId={clientIds[0] || id}
        title="Associated Banks"
        description="Banks associated with household members in active financial rollup"
        items={associatedBanks.map((f) => ({
          id: f.id || "",
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/crm/banks"
        icon={Landmark}
        onUnlinkAction={unlinkClientFromBank}
        noCard={true}
      />
    </div>
  );
}
