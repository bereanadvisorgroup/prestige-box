import { notFound } from "next/navigation";

import { Shield } from "lucide-react";

import { getHouseholdActiveRollupClients } from "@/actions/households";
import { getPropertyAndCasualtyFirms, unlinkClientFromPropertyAndCasualtyFirm } from "@/actions/property-and-casualty";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HouseholdPropertyAndCasualtyPage({ params }: Props) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;
  const pcFirmsRes = await getPropertyAndCasualtyFirms();
  const allFirms = (pcFirmsRes.success && pcFirmsRes.propertyAndCasualtyFirms) || [];

  const associatedFirms = allFirms.filter((f) => f.clientIds?.some((cId: string) => clientIds.includes(cId)));

  return (
    <div className="py-4">
      <HouseholdHeaderPortal sectionName="Property And Casualty" />
      <AssociationCardList
        entityId={clientIds[0] || id}
        title="Associated Property & Casualty Firms"
        description="Property & Casualty firms associated with household members in active financial rollup"
        items={associatedFirms.map((f) => ({
          id: f.id || "",
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/crm/property-and-casualty"
        icon={Shield}
        onUnlinkAction={unlinkClientFromPropertyAndCasualtyFirm}
        noCard={true}
      />
    </div>
  );
}
