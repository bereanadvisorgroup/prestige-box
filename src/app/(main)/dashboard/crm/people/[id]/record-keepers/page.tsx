import { notFound } from "next/navigation";

import { Database } from "lucide-react";

import { getPerson } from "@/actions/people";
import { getRecordKeepers } from "@/actions/record-keepers";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { PersonHeaderPortal } from "../_components/person-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonRecordKeepersPage({ params }: Props) {
  const { id } = await params;
  const [personRes, firmsRes] = await Promise.all([getPerson(id), getRecordKeepers()]);

  if (!personRes.success || !personRes.person) {
    notFound();
  }

  const allFirms = (firmsRes.success && firmsRes.recordKeepers) || [];
  const associatedFirms = allFirms.filter((c) => c.personIds?.includes(id));

  return (
    <div className="py-4">
      <PersonHeaderPortal sectionName="Record Keepers" />
      <AssociationCardList
        entityId={id}
        title="Associated Record Keepers"
        description="Record keepers this person is associated with"
        items={associatedFirms.map((c) => ({
          id: c.id!,
          name: c.firmName,
          website: c.website,
          phone: c.phone,
          title: (c.personTitles as Record<string, string>)?.[id] || "Plan Administrator",
        }))}
        linkPrefix="/dashboard/admin/record-keepers"
        icon={Database}
      />
    </div>
  );
}
