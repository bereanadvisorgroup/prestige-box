import { notFound } from "next/navigation";

import { Scale } from "lucide-react";

import { getCompany } from "@/actions/companies";
import { getLawFirms, linkCompanyToLawFirm, unlinkCompanyFromLawFirm } from "@/actions/law-firms";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { LinkFirmDialog } from "@/components/crm/link-firm-dialog";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LawFirmsPage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const lawFirmsRes = await getLawFirms();
  const allFirms = (lawFirmsRes.success && lawFirmsRes.lawFirms) || [];

  const associatedLawFirms = allFirms.filter((l) => l.companyIds?.includes(company.id || ""));

  const availableFirms = allFirms
    .filter((l) => !l.companyIds?.includes(company.id || ""))
    .map((l) => ({ id: l.id || "", name: l.firmName }));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <AssociationCardList
        entityId={company.id || ""}
        title="Associated Law Firms"
        description="Law firms this company is associated with"
        items={associatedLawFirms.map((f) => ({
          id: f.id || "",
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/crm/law-firms"
        icon={Scale}
        onUnlinkAction={unlinkCompanyFromLawFirm}
        actionNode={
          <LinkFirmDialog
            entityId={company.id || ""}
            firmTypeLabel="Law Firm"
            availableFirms={availableFirms}
            newFirmLink={`/dashboard/crm/law-firms/new?companyId=${company.id}`}
            onLinkAction={linkCompanyToLawFirm}
          />
        }
      />
    </div>
  );
}
