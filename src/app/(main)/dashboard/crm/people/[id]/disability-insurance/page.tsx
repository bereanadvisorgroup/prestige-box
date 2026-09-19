import { notFound } from "next/navigation";

import { ShieldAlert } from "lucide-react";

import { getDisabilityInsuranceCompanies } from "@/actions/disability-insurance-companies";
import { getPerson } from "@/actions/people";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { PersonHeaderPortal } from "../_components/person-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonDisabilityInsurancePage({ params }: Props) {
  const { id } = await params;
  const [personRes, companiesRes] = await Promise.all([getPerson(id), getDisabilityInsuranceCompanies()]);

  if (!personRes.success || !personRes.person) {
    notFound();
  }

  const allCompanies = (companiesRes.success && companiesRes.companies) || [];
  const associatedCompanies = allCompanies.filter((c) => c.personIds?.includes(id));

  return (
    <div className="py-4">
      <PersonHeaderPortal sectionName="Disability Insurance" />
      <AssociationCardList
        entityId={id}
        title="Associated Disability Insurance Companies"
        description="Disability insurance companies this person is associated with"
        items={associatedCompanies.map((c) => ({
          id: c.id!,
          name: c.name,
          website: c.websiteUrl,
          phone: c.phone,
          title: (c.personTitles as Record<string, string>)?.[id] || "Insurance Professional",
        }))}
        linkPrefix="/dashboard/admin/disability-insurance-companies"
        icon={ShieldAlert}
      />
    </div>
  );
}
