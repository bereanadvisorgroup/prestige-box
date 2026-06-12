import { notFound } from "next/navigation";

import { Building2, Calculator } from "lucide-react";

import { getActuarialFirms } from "@/actions/actuarial-firms";
import { getCompany } from "@/actions/companies";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ActuarialFirmsPage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const actuarialFirmsRes = await getActuarialFirms();
  const associatedActuarialFirms = ((actuarialFirmsRes.success && actuarialFirmsRes.actuarialFirms) || []).filter((a) =>
    a.companyIds?.includes(company.id || ""),
  );

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      {associatedActuarialFirms.length > 0 ? (
        <AssociationCardList
          title="Associated Actuarial Firms"
          description="Actuarial firms this company is associated with"
          items={associatedActuarialFirms.map((f) => ({
            id: f.id || "",
            name: f.firmName,
            website: f.website,
            phone: f.phone,
          }))}
          linkPrefix="/dashboard/crm/actuarial-firms"
          icon={Calculator}
        />
      ) : (
        <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm italic">No associated actuarial firms found.</p>
        </Card>
      )}
    </div>
  );
}
