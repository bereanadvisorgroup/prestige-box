import { notFound } from "next/navigation";

import { Calculator } from "lucide-react";

import { getActuarialFirms } from "@/actions/actuarial-firms";
import { getPerson } from "@/actions/people";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { PersonHeaderPortal } from "../_components/person-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonActuarialFirmsPage({ params }: Props) {
  const { id } = await params;
  const [personRes, firmsRes] = await Promise.all([getPerson(id), getActuarialFirms()]);

  if (!personRes.success || !personRes.person) {
    notFound();
  }

  const allFirms = (firmsRes.success && firmsRes.actuarialFirms) || [];
  const associatedFirms = allFirms.filter((f) => f.personIds?.includes(id));

  return (
    <div className="py-4">
      <PersonHeaderPortal sectionName="Actuarial Firms" />
      <AssociationCardList
        entityId={id}
        title="Associated Actuarial Firms"
        description="Actuarial firms this person is associated with"
        items={associatedFirms.map((f) => ({
          id: f.id!,
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          title: (f.personTitles as Record<string, string>)?.[id] || "Actuarial Professional",
        }))}
        linkPrefix="/dashboard/crm/actuarial-firms"
        icon={Calculator}
      />
    </div>
  );
}
