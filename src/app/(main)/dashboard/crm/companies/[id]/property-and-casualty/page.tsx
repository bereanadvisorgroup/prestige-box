import { notFound } from "next/navigation";

import { Building2, Shield } from "lucide-react";

import { getCompany } from "@/actions/companies";
import { getPropertyAndCasualtyFirms } from "@/actions/property-and-casualty";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyAndCasualtyPage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const firmsRes = await getPropertyAndCasualtyFirms();
  const associatedFirms = ((firmsRes.success && firmsRes.propertyAndCasualtyFirms) || []).filter((f) =>
    f.companyIds?.includes(company.id || ""),
  );

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      {associatedFirms.length > 0 ? (
        <AssociationCardList
          title="Associated Property And Casualty Firms"
          description="Property and casualty firms this company is associated with"
          items={associatedFirms.map((f) => ({
            id: f.id || "",
            name: f.firmName,
            website: f.website,
            phone: f.phone,
          }))}
          linkPrefix="/dashboard/crm/property-and-casualty"
          icon={Shield}
        />
      ) : (
        <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm italic">No associated property and casualty firms found.</p>
        </Card>
      )}
    </div>
  );
}
