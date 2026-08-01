import { notFound } from "next/navigation";

import { Building2, Calculator, Landmark, ReceiptText, Scale, Shield } from "lucide-react";

import { getAccountingFirms } from "@/actions/accounting-firms";
import { getActuarialFirms } from "@/actions/actuarial-firms";
import { getBanks } from "@/actions/banks";
import { getClient } from "@/actions/clients";
import { getLawFirms } from "@/actions/law-firms";
import { getPropertyAndCasualtyFirms } from "@/actions/property-and-casualty";
import { AssociationCardList } from "@/components/features/crm/association-card-list";
import { Card } from "@/components/ui/card";

import { ClientHeaderPortal } from "../_components/client-header-portal";
import { DocumentsTab } from "../_components/tabs/documents-tab";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProfessionalServicesPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;

  // Fetch professional services
  const [lawFirmsRes, accountingFirmsRes, actuarialFirmsRes, banksRes, propertyAndCasualtyFirmsRes] = await Promise.all(
    [getLawFirms(), getAccountingFirms(), getActuarialFirms(), getBanks(), getPropertyAndCasualtyFirms()],
  );

  // Filter professional services by client.id
  const associatedLawFirms = ((lawFirmsRes.success && lawFirmsRes.lawFirms) || []).filter((l) =>
    l.clientIds?.includes(client.id || ""),
  );
  const associatedAccountingFirms = ((accountingFirmsRes.success && accountingFirmsRes.accountingFirms) || []).filter(
    (a) => a.clientIds?.includes(client.id || ""),
  );
  const associatedActuarialFirms = ((actuarialFirmsRes.success && actuarialFirmsRes.actuarialFirms) || []).filter(
    (act) => act.clientIds?.includes(client.id || ""),
  );
  const associatedBanks = ((banksRes.success && banksRes.banks) || []).filter((b) =>
    b.clientIds?.includes(client.id || ""),
  );
  const associatedPropertyAndCasualties = (
    (propertyAndCasualtyFirmsRes.success && propertyAndCasualtyFirmsRes.propertyAndCasualtyFirms) ||
    []
  ).filter((pc) => pc.clientIds?.includes(client.id || ""));

  const hasAssociations =
    associatedLawFirms.length > 0 ||
    associatedAccountingFirms.length > 0 ||
    associatedActuarialFirms.length > 0 ||
    associatedBanks.length > 0 ||
    associatedPropertyAndCasualties.length > 0;

  return (
    <div className="py-4">
      <ClientHeaderPortal sectionName="Professional Services" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {associatedLawFirms.length > 0 && (
            <AssociationCardList
              title="Associated Law Firms"
              description="Law firms this client is associated with"
              items={associatedLawFirms.map((f) => ({
                id: f.id || "",
                name: f.firmName,
                website: f.website,
                phone: f.phone,
              }))}
              linkPrefix="/dashboard/crm/law-firms"
              icon={Scale}
              noCard={true}
            />
          )}

          {associatedAccountingFirms.length > 0 && (
            <AssociationCardList
              title="Associated Accounting Firms"
              description="Accounting firms this client is associated with"
              items={associatedAccountingFirms.map((f) => ({
                id: f.id || "",
                name: f.firmName,
                website: f.website,
                phone: f.phone,
              }))}
              linkPrefix="/dashboard/crm/accounting-firms"
              icon={ReceiptText}
              noCard={true}
            />
          )}

          {associatedActuarialFirms.length > 0 && (
            <AssociationCardList
              title="Associated Actuarial Firms"
              description="Actuarial firms this client is associated with"
              items={associatedActuarialFirms.map((f) => ({
                id: f.id || "",
                name: f.firmName,
                website: f.website,
                phone: f.phone,
              }))}
              linkPrefix="/dashboard/crm/actuarial-firms"
              icon={Calculator}
              noCard={true}
            />
          )}

          {associatedBanks.length > 0 && (
            <AssociationCardList
              title="Associated Banks"
              description="Banks this client is associated with"
              items={associatedBanks.map((f) => ({
                id: f.id || "",
                name: f.firmName,
                website: f.website,
                phone: f.phone,
              }))}
              linkPrefix="/dashboard/crm/banks"
              icon={Landmark}
              noCard={true}
            />
          )}

          {associatedPropertyAndCasualties.length > 0 && (
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
              noCard={true}
            />
          )}

          {!hasAssociations && (
            <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
              <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm italic">No associated professional services found.</p>
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
            noCard={true}
          />
        </div>
      </div>
    </div>
  );
}
