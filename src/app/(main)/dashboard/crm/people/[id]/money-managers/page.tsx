import { notFound } from "next/navigation";

import { TrendingUp } from "lucide-react";

import { getMoneyManagers } from "@/actions/money-managers";
import { getPerson } from "@/actions/people";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { PersonHeaderPortal } from "../_components/person-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonMoneyManagersPage({ params }: Props) {
  const { id } = await params;
  const [personRes, firmsRes] = await Promise.all([getPerson(id), getMoneyManagers()]);

  if (!personRes.success || !personRes.person) {
    notFound();
  }

  const allFirms = (firmsRes.success && firmsRes.moneyManagers) || [];
  const associatedFirms = allFirms.filter((c) => c.personIds?.includes(id));

  return (
    <div className="py-4">
      <PersonHeaderPortal sectionName="Money Managers" />
      <AssociationCardList
        entityId={id}
        title="Associated Money Managers"
        description="Money managers this person is associated with"
        items={associatedFirms.map((c) => ({
          id: c.id!,
          name: c.firmName,
          website: c.website,
          phone: c.phone,
          title: (c.personTitles as Record<string, string>)?.[id] || "Wealth Advisor",
        }))}
        linkPrefix="/dashboard/admin/money-managers"
        icon={TrendingUp}
      />
    </div>
  );
}
