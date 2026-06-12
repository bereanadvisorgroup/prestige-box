import { notFound } from "next/navigation";

import { Building2, Shield } from "lucide-react";

import { getClient } from "@/actions/clients";
import { getPropertyAndCasualtyFirms } from "@/actions/property-and-casualty";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";

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
  const associatedPropertyAndCasualties = (
    (propertyAndCasualtyFirmsRes.success && propertyAndCasualtyFirmsRes.propertyAndCasualtyFirms) ||
    []
  ).filter((pc) => pc.clientIds?.includes(client.id || ""));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {associatedPropertyAndCasualties.length > 0 ? (
            <AssociationCardList
              title="Associated Property & Casualty Firms"
              description="Property and Casualty firms this client is associated with"
              items={associatedPropertyAndCasualties.map((f) => ({
                id: f.id || "",
                name: f.firmName,
                website: f.website,
                phone: f.phone,
              }))}
              linkPrefix="/dashboard/crm/property-and-casualty"
              icon={Shield}
            />
          ) : (
            <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
              <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm italic">No associated property & casualty firms found.</p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <DocumentsTab
            client={client}
            category="pcDocuments"
            title="Property & Casualty Documents"
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
