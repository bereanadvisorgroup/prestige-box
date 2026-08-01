import { notFound } from "next/navigation";

import { Scale } from "lucide-react";

import { getHouseholdActiveRollupClients } from "@/actions/households";
import { getLawFirms, unlinkClientFromLawFirm } from "@/actions/law-firms";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HouseholdLawFirmsPage({ params }: Props) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;
  const lawFirmsRes = await getLawFirms();
  const allFirms = (lawFirmsRes.success && lawFirmsRes.lawFirms) || [];

  const associatedLawFirms = allFirms.filter((l) => l.clientIds?.some((cId: string) => clientIds.includes(cId)));

  return (
    <div className="py-4">
      <HouseholdHeaderPortal sectionName="Law Firms" />
      <AssociationCardList
        entityId={clientIds[0] || id}
        title="Associated Law Firms"
        description="Law firms associated with household members in active financial rollup"
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
