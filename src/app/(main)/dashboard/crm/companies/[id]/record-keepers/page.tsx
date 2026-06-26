import { notFound } from "next/navigation";

import { Database } from "lucide-react";

import { getCompany } from "@/actions/companies";
import { getRecordKeepers, linkCompanyToRecordKeeper, unlinkCompanyFromRecordKeeper } from "@/actions/record-keepers";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { LinkFirmDialog } from "@/components/crm/link-firm-dialog";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecordKeeperPage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const res = await getRecordKeepers();
  const allFirms = (res.success && res.recordKeepers) || [];

  const associatedFirms = allFirms.filter((f: any) => f.companyIds?.includes(company.id || ""));

  const availableFirms = allFirms
    .filter((f: any) => !f.companyIds?.includes(company.id || ""))
    .map((f: any) => ({ id: f.id || "", name: f.name || f.firmName }));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <AssociationCardList
        entityId={company.id || ""}
        title="Associated Record Keepers"
        description="Record keepers this company is associated with"
        items={associatedFirms.map((f: any) => ({
          id: f.id || "",
          name: f.name || f.firmName,
          website: f.website || f.websiteUrl,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/admin/record-keepers"
        icon={Database}
        onUnlinkAction={unlinkCompanyFromRecordKeeper}
        actionNode={
          <LinkFirmDialog
            entityId={company.id || ""}
            firmTypeLabel="Record Keeper"
            availableFirms={availableFirms}
            newFirmLink={`/dashboard/admin/record-keepers/new?companyId=${company.id}`}
            onLinkAction={linkCompanyToRecordKeeper}
          />
        }
      />
    </div>
  );
}
