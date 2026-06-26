import { notFound } from "next/navigation";

import { ReceiptText } from "lucide-react";

import {
  getAccountingFirms,
  linkCompanyToAccountingFirm,
  unlinkCompanyFromAccountingFirm,
} from "@/actions/accounting-firms";
import { getCompany } from "@/actions/companies";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { LinkFirmDialog } from "@/components/crm/link-firm-dialog";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AccountingFirmsPage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const accountingFirmsRes = await getAccountingFirms();
  const allFirms = (accountingFirmsRes.success && accountingFirmsRes.accountingFirms) || [];

  const associatedAccountingFirms = allFirms.filter((a) => a.companyIds?.includes(company.id || ""));

  const availableFirms = allFirms
    .filter((a) => !a.companyIds?.includes(company.id || ""))
    .map((a) => ({ id: a.id || "", name: a.firmName }));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <AssociationCardList
        entityId={company.id || ""}
        title="Associated Accounting Firms"
        description="Accounting firms this company is associated with"
        items={associatedAccountingFirms.map((f) => ({
          id: f.id || "",
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/crm/accounting-firms"
        icon={ReceiptText}
        onUnlinkAction={unlinkCompanyFromAccountingFirm}
        actionNode={
          <LinkFirmDialog
            entityId={company.id || ""}
            firmTypeLabel="Accounting Firm"
            availableFirms={availableFirms}
            newFirmLink={`/dashboard/crm/accounting-firms/new?companyId=${company.id}`}
            onLinkAction={linkCompanyToAccountingFirm}
          />
        }
      />
    </div>
  );
}
