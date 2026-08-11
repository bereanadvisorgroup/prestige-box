import { notFound } from "next/navigation";

import { Shield } from "lucide-react";

import {
  getInsuranceAgencies,
  linkCompanyToInsuranceAgency,
  unlinkCompanyFromInsuranceAgency,
} from "@/actions/insurance-agencies";
import { getCompany } from "@/actions/companies";
import { AssociationCardList } from "@/components/features/crm/association-card-list";
import { LinkFirmDialog } from "@/components/features/crm/link-firm-dialog";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InsuranceAgenciesPage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const insuranceAgenciesRes = await getInsuranceAgencies();
  const allFirms = (insuranceAgenciesRes.success && insuranceAgenciesRes.insuranceAgencies) || [];

  const associatedInsuranceAgencies = allFirms.filter((a) => a.companyIds?.includes(company.id || ""));

  const availableFirms = allFirms
    .filter((a) => !a.companyIds?.includes(company.id || ""))
    .map((a) => ({ id: a.id || "", name: a.firmName }));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <AssociationCardList
        entityId={company.id || ""}
        title="Associated Insurance Agencies"
        description="Insurance agencies this company is associated with"
        items={associatedInsuranceAgencies.map((f) => ({
          id: f.id || "",
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/crm/insurance-agencies"
        icon={Shield}
        onUnlinkAction={unlinkCompanyFromInsuranceAgency}
        actionNode={
          <LinkFirmDialog
            entityId={company.id || ""}
            firmTypeLabel="Insurance Agency"
            availableFirms={availableFirms}
            newFirmLink={`/dashboard/crm/insurance-agencies/new?companyId=${company.id}`}
            onLinkAction={linkCompanyToInsuranceAgency}
          />
        }
      />
    </div>
  );
}
