import { notFound } from "next/navigation";

import { Shield } from "lucide-react";

import {
  getInsuranceAgencies,
  linkClientToInsuranceAgency,
  unlinkClientFromInsuranceAgency,
} from "@/actions/insurance-agencies";
import { getClient } from "@/actions/clients";
import { AssociationCardList } from "@/components/features/crm/association-card-list";
import { LinkFirmDialog } from "@/components/features/crm/link-firm-dialog";

import { ClientHeaderPortal } from "../_components/client-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InsuranceAgenciesPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const insuranceAgenciesRes = await getInsuranceAgencies();
  const allFirms = (insuranceAgenciesRes.success && insuranceAgenciesRes.insuranceAgencies) || [];

  const associatedInsuranceAgencies = allFirms.filter((a) => a.clientIds?.includes(client.id || ""));

  const availableFirms = allFirms
    .filter((a) => !a.clientIds?.includes(client.id || ""))
    .map((a) => ({ id: a.id || "", name: a.firmName }));

  return (
    <div className="py-4">
      <ClientHeaderPortal sectionName="Insurance Agencies">
        <LinkFirmDialog
          entityId={client.id || ""}
          firmTypeLabel="Insurance Agency"
          availableFirms={availableFirms}
          newFirmLink={`/dashboard/crm/insurance-agencies/new?clientId=${client.id}`}
          onLinkAction={linkClientToInsuranceAgency}
        />
      </ClientHeaderPortal>
      <AssociationCardList
        entityId={client.id || ""}
        title="Associated Insurance Agencies"
        description="Insurance agencies this client is associated with"
        items={associatedInsuranceAgencies.map((f) => ({
          id: f.id || "",
          name: f.firmName,
          website: f.website,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="/dashboard/crm/insurance-agencies"
        icon={Shield}
        onUnlinkAction={unlinkClientFromInsuranceAgency}
        noCard={true}
      />
    </div>
  );
}
