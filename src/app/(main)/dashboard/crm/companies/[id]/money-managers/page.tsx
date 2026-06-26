import { notFound } from "next/navigation";

import { TrendingUp } from "lucide-react";

import { getCompany } from "@/actions/companies";
import { getMoneyManagers, linkCompanyToMoneyManager, unlinkCompanyFromMoneyManager } from "@/actions/money-managers";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { LinkFirmDialog } from "@/components/crm/link-firm-dialog";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MoneyManagerPage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const res = await getMoneyManagers();
  const allFirms = (res.success && res.moneyManagers) || [];

  const associatedFirms = allFirms.filter((f: any) => f.companyIds?.includes(company.id || ""));

  const availableFirms = allFirms
    .filter((f: any) => !f.companyIds?.includes(company.id || ""))
    .map((f: any) => ({ id: f.id || "", name: f.name || f.firmName }));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <AssociationCardList
        entityId={company.id || ""}
        title="Associated Money Managers"
        description="Money managers this company is associated with"
        items={associatedFirms.map((f: any) => ({
          id: f.id || "",
          name: f.name || f.firmName,
          website: f.website || f.websiteUrl,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/admin/money-managers"
        icon={TrendingUp}
        onUnlinkAction={unlinkCompanyFromMoneyManager}
        actionNode={
          <LinkFirmDialog
            entityId={company.id || ""}
            firmTypeLabel="Money Manager"
            availableFirms={availableFirms}
            newFirmLink={`/dashboard/admin/money-managers/new?companyId=${company.id}`}
            onLinkAction={linkCompanyToMoneyManager}
          />
        }
      />
    </div>
  );
}
