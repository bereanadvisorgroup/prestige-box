import { notFound } from "next/navigation";

import { Building2, ShieldAlert } from "lucide-react";

import { getCompany } from "@/actions/companies";
import { getDisabilityInsuranceCompanies } from "@/actions/disability-insurance-companies";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DisabilityInsurancePage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const disabilityRes = await getDisabilityInsuranceCompanies();
  const associatedDisability = ((disabilityRes.success && disabilityRes.companies) || []).filter((c) =>
    c.companyIds?.includes(company.id || ""),
  );

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      {associatedDisability.length > 0 ? (
        <AssociationCardList
          title="Associated Disability Insurance Companies"
          description="Disability insurance companies this company is associated with"
          items={associatedDisability.map((c) => ({
            id: c.id || "",
            name: c.name,
            website: c.websiteUrl,
            phone: c.phone,
          }))}
          linkPrefix="/dashboard/admin/disability-insurance-companies"
          icon={ShieldAlert}
        />
      ) : (
        <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm italic">No associated disability insurance companies found.</p>
        </Card>
      )}
    </div>
  );
}
