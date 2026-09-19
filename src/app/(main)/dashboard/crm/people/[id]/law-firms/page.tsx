import { notFound } from "next/navigation";

import { Scale } from "lucide-react";

import { getLawFirms } from "@/actions/law-firms";
import { getPerson } from "@/actions/people";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { PersonHeaderPortal } from "../_components/person-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonLawFirmsPage({ params }: Props) {
  const { id } = await params;
  const [personRes, lawFirmsRes] = await Promise.all([getPerson(id), getLawFirms()]);

  if (!personRes.success || !personRes.person) {
    notFound();
  }

  const allFirms = (lawFirmsRes.success && lawFirmsRes.lawFirms) || [];
  const associatedLawFirms = allFirms.filter((f) => f.personIds?.includes(id));

  return (
    <div className="py-4">
      <PersonHeaderPortal sectionName="Law Firms" />
      <AssociationCardList
        entityId={id}
        title="Associated Law Firms"
        description="Law firms this person is associated with"
        items={associatedLawFirms.map((f) => ({
          id: f.id!,
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          title: (f.personTitles as Record<string, string>)?.[id] || "Legal Professional",
        }))}
        linkPrefix="/dashboard/crm/law-firms"
        icon={Scale}
      />
    </div>
  );
}
