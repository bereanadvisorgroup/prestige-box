import { notFound } from "next/navigation";

import { Building2, HeartHandshake } from "lucide-react";

import { getCompany } from "@/actions/companies";
import { getLifeInsuranceCompanies } from "@/actions/life-insurance-companies";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LifeInsurancePage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const lifeRes = await getLifeInsuranceCompanies();
  const associatedLife = ((lifeRes.success && lifeRes.companies) || []).filter((c) =>
    c.companyIds?.includes(company.id || ""),
  );

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      {associatedLife.length > 0 ? (
        <AssociationCardList
          title="Associated Life Insurance Companies"
          description="Life insurance companies this company is associated with"
          items={associatedLife.map((c) => ({
            id: c.id || "",
            name: c.name,
            website: c.websiteUrl,
            phone: c.phone,
          }))}
          linkPrefix="/dashboard/admin/life-insurance-companies"
          icon={HeartHandshake}
        />
      ) : (
        <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm italic">No associated life insurance companies found.</p>
        </Card>
      )}
    </div>
  );
}
