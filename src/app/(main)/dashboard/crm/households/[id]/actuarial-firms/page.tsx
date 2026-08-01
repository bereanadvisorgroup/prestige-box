import { notFound } from "next/navigation";

import { Calculator } from "lucide-react";

import { getActuarialFirms, unlinkClientFromActuarialFirm } from "@/actions/actuarial-firms";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HouseholdActuarialFirmsPage({ params }: Props) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;
  const actuarialFirmsRes = await getActuarialFirms();
  const allFirms = (actuarialFirmsRes.success && actuarialFirmsRes.actuarialFirms) || [];

  const associatedActuarialFirms = allFirms.filter((a) => a.clientIds?.some((cId: string) => clientIds.includes(cId)));

  return (
    <div className="py-4">
      <HouseholdHeaderPortal sectionName="Actuarial Firms" />
      <AssociationCardList
        entityId={clientIds[0] || id}
        title="Associated Actuarial Firms"
        description="Actuarial firms associated with household members in active financial rollup"
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
        noCard={true}
      />
    </div>
  );
}
