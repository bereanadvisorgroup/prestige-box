import { notFound } from "next/navigation";

import { ReceiptText } from "lucide-react";

import { getAccountingFirms } from "@/actions/accounting-firms";
import { getPerson } from "@/actions/people";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { PersonHeaderPortal } from "../_components/person-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonAccountingFirmsPage({ params }: Props) {
  const { id } = await params;
  const [personRes, firmsRes] = await Promise.all([getPerson(id), getAccountingFirms()]);

  if (!personRes.success || !personRes.person) {
    notFound();
  }

  const allFirms = (firmsRes.success && firmsRes.accountingFirms) || [];
  const associatedFirms = allFirms.filter((f) => f.personIds?.includes(id));

  return (
    <div className="py-4">
      <PersonHeaderPortal sectionName="Accounting Firms" />
      <AssociationCardList
        entityId={id}
        title="Associated Accounting Firms"
        description="Accounting firms this person is associated with"
        items={associatedFirms.map((f) => ({
          id: f.id!,
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          title: (f.personTitles as Record<string, string>)?.[id] || "Accounting Professional",
        }))}
        linkPrefix="/dashboard/crm/accounting-firms"
        icon={ReceiptText}
      />
    </div>
  );
}
