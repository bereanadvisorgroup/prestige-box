import { notFound } from "next/navigation";

import { Shield } from "lucide-react";

import { getCompany } from "@/actions/companies";
import {
  getPropertyAndCasualtyFirms,
  linkCompanyToPropertyAndCasualtyFirm,
  unlinkCompanyFromPropertyAndCasualtyFirm,
} from "@/actions/property-and-casualty";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { LinkFirmDialog } from "@/components/crm/link-firm-dialog";

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
  const allFirms = (firmsRes.success && firmsRes.propertyAndCasualtyFirms) || [];

  const associatedFirms = allFirms.filter((f) => f.companyIds?.includes(company.id || ""));

  const availableFirms = allFirms
    .filter((f) => !f.companyIds?.includes(company.id || ""))
    .map((f) => ({ id: f.id || "", name: f.firmName }));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <AssociationCardList
        entityId={company.id || ""}
        title="Associated Property And Casualty Firms"
        description="Property and casualty firms this company is associated with"
        items={associatedFirms.map((f) => ({
          id: f.id || "",
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/crm/property-and-casualty"
        icon={Shield}
        onUnlinkAction={unlinkCompanyFromPropertyAndCasualtyFirm}
        actionNode={
          <LinkFirmDialog
            entityId={company.id || ""}
            firmTypeLabel="Property and Casualty Firm"
            availableFirms={availableFirms}
            newFirmLink={`/dashboard/crm/property-and-casualty/new?companyId=${company.id}`}
            onLinkAction={linkCompanyToPropertyAndCasualtyFirm}
          />
        }
      />
    </div>
  );
}
