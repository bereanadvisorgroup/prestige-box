import { notFound } from "next/navigation";

import { Shield } from "lucide-react";

import { getInsuranceAgencies } from "@/actions/insurance-agencies";
import { getPerson } from "@/actions/people";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { PersonHeaderPortal } from "../_components/person-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonInsuranceAgenciesPage({ params }: Props) {
  const { id } = await params;
  const [personRes, firmsRes] = await Promise.all([getPerson(id), getInsuranceAgencies()]);

  if (!personRes.success || !personRes.person) {
    notFound();
  }

  const allFirms = (firmsRes.success && firmsRes.insuranceAgencies) || [];
  const associatedFirms = allFirms.filter((f) => f.personIds?.includes(id));

  return (
    <div className="py-4">
      <PersonHeaderPortal sectionName="Insurance Agencies" />
      <AssociationCardList
        entityId={id}
        title="Associated Insurance Agencies"
        description="Insurance agencies this person is associated with"
        items={associatedFirms.map((f) => ({
          id: f.id!,
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          title: (f.personTitles as Record<string, string>)?.[id] || "Insurance Professional",
        }))}
        linkPrefix="/dashboard/crm/insurance-agencies"
        icon={Shield}
      />
    </div>
  );
}
