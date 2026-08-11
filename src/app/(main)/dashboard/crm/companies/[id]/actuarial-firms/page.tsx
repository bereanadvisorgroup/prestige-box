import { notFound } from "next/navigation";

import { Calculator } from "lucide-react";

import {
  getActuarialFirms,
  linkCompanyToActuarialFirm,
  unlinkCompanyFromActuarialFirm,
} from "@/actions/actuarial-firms";
import { getCompany } from "@/actions/companies";
import { AssociationCardList } from "@/components/features/crm/association-card-list";
import { LinkFirmDialog } from "@/components/features/crm/link-firm-dialog";

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
  const allFirms = (actuarialFirmsRes.success && actuarialFirmsRes.actuarialFirms) || [];

  const associatedActuarialFirms = allFirms.filter((a) => a.companyIds?.includes(company.id || ""));

  const availableFirms = allFirms
    .filter((a) => !a.companyIds?.includes(company.id || ""))
    .map((a) => ({ id: a.id || "", name: a.firmName }));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <AssociationCardList
        entityId={company.id || ""}
        title="Associated Actuarial Firms"
        description="Actuarial firms this company is associated with"
        items={associatedActuarialFirms.map((f) => ({
          id: f.id || "",
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/crm/actuarial-firms"
        icon={Calculator}
        onUnlinkAction={unlinkCompanyFromActuarialFirm}
        actionNode={
          <LinkFirmDialog
            entityId={company.id || ""}
            firmTypeLabel="Actuarial Firm"
            availableFirms={availableFirms}
            newFirmLink={`/dashboard/crm/actuarial-firms/new?companyId=${company.id}`}
            onLinkAction={linkCompanyToActuarialFirm}
          />
        }
      />
    </div>
  );
}
