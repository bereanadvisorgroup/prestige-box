import { notFound } from "next/navigation";

import { Building2, HeartPulse } from "lucide-react";

import { getCompany } from "@/actions/companies";
import { getLongTermCareInsurances } from "@/actions/long-term-care-insurance";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LongTermCarePage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const ltcRes = await getLongTermCareInsurances();
  const associatedLtc = ((ltcRes.success && ltcRes.companies) || []).filter((c) =>
    c.companyIds?.includes(company.id || ""),
  );

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      {associatedLtc.length > 0 ? (
        <AssociationCardList
          title="Associated Long Term Care Insurance"
          description="Long term care insurance this company is associated with"
          items={associatedLtc.map((c) => ({
            id: c.id || "",
            name: c.name,
            website: c.websiteUrl,
            phone: c.phone,
          }))}
          linkPrefix="/dashboard/admin/long-term-care-insurance"
          icon={HeartPulse}
        />
      ) : (
        <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm italic">No associated long term care insurance found.</p>
        </Card>
      )}
    </div>
  );
}
