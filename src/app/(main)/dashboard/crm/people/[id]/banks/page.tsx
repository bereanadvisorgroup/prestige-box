import { notFound } from "next/navigation";

import { Landmark } from "lucide-react";

import { getBanks } from "@/actions/banks";
import { getPerson } from "@/actions/people";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { PersonHeaderPortal } from "../_components/person-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonBanksPage({ params }: Props) {
  const { id } = await params;
  const [personRes, firmsRes] = await Promise.all([getPerson(id), getBanks()]);

  if (!personRes.success || !personRes.person) {
    notFound();
  }

  const allFirms = (firmsRes.success && firmsRes.banks) || [];
  const associatedFirms = allFirms.filter((f) => f.personIds?.includes(id));

  return (
    <div className="py-4">
      <PersonHeaderPortal sectionName="Banks" />
      <AssociationCardList
        entityId={id}
        title="Associated Banks"
        description="Banks this person is associated with"
        items={associatedFirms.map((f) => ({
          id: f.id!,
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          title: (f.personTitles as Record<string, string>)?.[id] || "Banking Professional",
        }))}
        linkPrefix="/dashboard/crm/banks"
        icon={Landmark}
      />
    </div>
  );
}
