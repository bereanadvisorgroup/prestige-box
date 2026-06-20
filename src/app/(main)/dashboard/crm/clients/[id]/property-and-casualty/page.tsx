import { notFound } from "next/navigation";

import { Building2, Shield } from "lucide-react";

import { getClient } from "@/actions/clients";
import {
  getPropertyAndCasualtyFirms,
  linkClientToPropertyAndCasualtyFirm,
  unlinkClientFromPropertyAndCasualtyFirm,
} from "@/actions/property-and-casualty";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { LinkFirmDialog } from "@/components/crm/link-firm-dialog";

import { DocumentsTab } from "../_components/tabs/documents-tab";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyAndCasualtyPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const propertyAndCasualtyFirmsRes = await getPropertyAndCasualtyFirms();
  const allFirms = (propertyAndCasualtyFirmsRes.success && propertyAndCasualtyFirmsRes.propertyAndCasualtyFirms) || [];

  const associatedPropertyAndCasualties = allFirms.filter((pc) => pc.clientIds?.includes(client.id || ""));

  const availableFirms = allFirms
    .filter((pc) => !pc.clientIds?.includes(client.id || ""))
    .map((pc) => ({ id: pc.id || "", name: pc.firmName }));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AssociationCardList
            clientId={client.id || ""}
            title="Associated Property & Casualty Firms"
            description="Property and Casualty firms this client is associated with"
            items={associatedPropertyAndCasualties.map((f) => ({
              id: f.id || "",
              name: f.firmName,
              website: f.website,
              phone: f.phone,
              isLinked: client.pcDocuments?.some((d) => d.firmId === f.id) || false,
            }))}
            linkPrefix="/dashboard/crm/property-and-casualty"
            icon={Shield}
            onUnlinkAction={unlinkClientFromPropertyAndCasualtyFirm}
            actionNode={
              <LinkFirmDialog
                clientId={client.id || ""}
                firmTypeLabel="Property & Casualty Firm"
                availableFirms={availableFirms}
                newFirmLink={`/dashboard/crm/property-and-casualty/new?clientId=${client.id}`}
                onLinkAction={linkClientToPropertyAndCasualtyFirm}
              />
            }
          />
        </div>

        <div className="lg:col-span-1">
          <DocumentsTab
            client={client}
            category="pcDocuments"
            title="Property & Casualty Documents"
            firms={associatedPropertyAndCasualties.map((f) => ({ id: f.id!, name: f.firmName }))}
            firmLabel="P&C Firm"
            types={[
              "Home Declaration Page",
              "Automobile Declaration Page",
              "Umbrella Declaration Page",
              "Flood Declaration Page",
              "Collections Declaration Page",
              "Boat/RV Declaration Page",
              "Elevation Certificate",
              "Wind Mitigation",
              "4 Point Inspection",
              "Other",
            ]}
          />
        </div>
      </div>
    </div>
  );
}
