import { notFound } from "next/navigation";

import { Landmark } from "lucide-react";

import { getBanks, linkCompanyToBank, unlinkCompanyFromBank } from "@/actions/banks";
import { getCompany } from "@/actions/companies";
import { AssociationCardList } from "@/components/features/crm/association-card-list";
import { LinkFirmDialog } from "@/components/features/crm/link-firm-dialog";

import { CompanyPaymentAccountsSection } from "../_components/company-payment-accounts-section";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BanksPage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const banksRes = await getBanks();
  const allFirms = (banksRes.success && banksRes.banks) || [];

  const associatedBanks = allFirms.filter((b) => b.companyIds?.includes(company.id || ""));

  const availableFirms = allFirms
    .filter((b) => !b.companyIds?.includes(company.id || ""))
    .map((b) => ({ id: b.id || "", name: b.firmName }));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <AssociationCardList
        entityId={company.id || ""}
        title="Associated Banks"
        description="Banks this company is associated with"
        items={associatedBanks.map((b) => ({
          id: b.id || "",
          name: b.firmName,
          website: b.website,
          phone: b.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/crm/banks"
        icon={Landmark}
        onUnlinkAction={unlinkCompanyFromBank}
        actionNode={
          <LinkFirmDialog
            entityId={company.id || ""}
            firmTypeLabel="Bank"
            availableFirms={availableFirms}
            newFirmLink={`/dashboard/crm/banks/new?companyId=${company.id}`}
            onLinkAction={linkCompanyToBank}
          />
        }
      />
      <CompanyPaymentAccountsSection company={company} associatedBanks={associatedBanks} />
    </div>
  );
}
