import { notFound } from "next/navigation";

import { FileText } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { getLawFirms } from "@/actions/law-firms";
import { getPeople } from "@/actions/people";
import {
  EstateDocumentsTab,
  type EstateParty,
} from "@/app/(main)/dashboard/crm/clients/[id]/_components/tabs/estate-documents-tab";
import { Card, CardContent } from "@/components/ui/card";
import { formatPersonName } from "@/lib/utils";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface HouseholdEstatePlanningPageProps {
  params: Promise<{ id: string }>;
}

export default async function HouseholdEstatePlanningPage({ params }: HouseholdEstatePlanningPageProps) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;

  const [allClientsRes, lawFirmsResult, peopleResult, companiesResult] = await Promise.all([
    getClients(),
    getLawFirms(),
    getPeople(),
    getCompanies(),
  ]);

  const allClients = allClientsRes.success ? allClientsRes.clients || [] : [];
  const activeClients = allClients.filter((c) => clientIds.includes(c.id || ""));

  const lawFirms = (lawFirmsResult.success ? (lawFirmsResult.lawFirms ?? []) : []).map((f) => ({
    id: f.id as string,
    name: f.firmName as string,
  }));

  const people: EstateParty[] = (peopleResult.success ? (peopleResult.people ?? []) : []).map((p) => ({
    id: p.id as string,
    name: formatPersonName(p, "Unnamed person"),
    kind: "person" as const,
  }));

  const companies: EstateParty[] = (companiesResult.success ? (companiesResult.companies ?? []) : []).map((c) => ({
    id: c.id as string,
    name: (c.name as string) || "Unnamed company",
    kind: "company" as const,
  }));

  const parties: EstateParty[] = [...people, ...companies].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6 py-4">
      <HouseholdHeaderPortal sectionName="Estate Planning" />
      {activeClients.length > 0 ? (
        activeClients.map((client) => (
          <div key={client.id} className="space-y-2">
            <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              Client: {formatPersonName(client.person, client.id)}
            </h3>
            <EstateDocumentsTab
              client={client}
              lawFirms={lawFirms}
              parties={parties}
              useHeaderPortal={false}
              noCard={false}
            />
          </div>
        ))
      ) : (
        <Card className="p-8 text-center text-muted-foreground shadow-sm">
          <CardContent className="pt-6">
            <FileText className="mx-auto mb-2 h-10 w-10 opacity-20" />
            <p className="text-sm">No active financial rollup clients in this household.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
