import { notFound } from "next/navigation";

import { Shield } from "lucide-react";

import { getInsuranceAgencies, unlinkClientFromInsuranceAgency } from "@/actions/insurance-agencies";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HouseholdInsuranceAgenciesPage({ params }: Props) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;
  const insuranceAgenciesRes = await getInsuranceAgencies();
  const allFirms = (insuranceAgenciesRes.success && insuranceAgenciesRes.insuranceAgencies) || [];

  const associatedInsuranceAgencies = allFirms.filter((a) => a.clientIds?.some((cId: string) => clientIds.includes(cId)));

  return (
    <div className="py-4">
      <HouseholdHeaderPortal sectionName="Insurance Agencies" />
      <AssociationCardList
        entityId={clientIds[0] || id}
        title="Associated Insurance Agencies"
        description="Insurance agencies associated with household members in active financial rollup"
        items={associatedInsuranceAgencies.map((f) => ({
          id: f.id || "",
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/crm/insurance-agencies"
        icon={Shield}
        onUnlinkAction={unlinkClientFromInsuranceAgency}
        noCard={true}
      />
    </div>
  );
}
