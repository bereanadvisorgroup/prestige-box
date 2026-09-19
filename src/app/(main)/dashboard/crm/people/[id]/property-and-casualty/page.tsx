import { notFound } from "next/navigation";

import { Shield } from "lucide-react";

import { getPerson } from "@/actions/people";
import { getPropertyAndCasualtyFirms } from "@/actions/property-and-casualty";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { PersonHeaderPortal } from "../_components/person-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonPropertyAndCasualtyPage({ params }: Props) {
  const { id } = await params;
  const [personRes, firmsRes] = await Promise.all([getPerson(id), getPropertyAndCasualtyFirms()]);

  if (!personRes.success || !personRes.person) {
    notFound();
  }

  const allFirms = (firmsRes.success && firmsRes.propertyAndCasualtyFirms) || [];
  const associatedFirms = allFirms.filter((f) => f.personIds?.includes(id));

  return (
    <div className="py-4">
      <PersonHeaderPortal sectionName="Property & Casualty" />
      <AssociationCardList
        entityId={id}
        title="Associated Property & Casualty Firms"
        description="Property and Casualty firms this person is associated with"
        items={associatedFirms.map((f) => ({
          id: f.id!,
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          title: (f.personTitles as Record<string, string>)?.[id] || "Insurance Professional",
        }))}
        linkPrefix="/dashboard/crm/property-and-casualty"
        icon={Shield}
      />
    </div>
  );
}
