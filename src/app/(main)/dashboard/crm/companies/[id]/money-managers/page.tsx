import { notFound } from "next/navigation";

import { Building2, TrendingUp } from "lucide-react";

import { getCompany } from "@/actions/companies";
import { getMoneyManagers } from "@/actions/money-managers";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MoneyManagersPage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const mmRes = await getMoneyManagers();
  const associatedMM = ((mmRes.success && mmRes.moneyManagers) || []).filter((m) =>
    m.companyIds?.includes(company.id || ""),
  );

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      {associatedMM.length > 0 ? (
        <AssociationCardList
          title="Associated Money Managers"
          description="Money managers this company is associated with"
          items={associatedMM.map((m) => ({
            id: m.id || "",
            name: m.firmName,
            website: m.website,
            phone: m.phone,
          }))}
          linkPrefix="/dashboard/admin/money-managers"
          icon={TrendingUp}
        />
      ) : (
        <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm italic">No associated money managers found.</p>
        </Card>
      )}
    </div>
  );
}
