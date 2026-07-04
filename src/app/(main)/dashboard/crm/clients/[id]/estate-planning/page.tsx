import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getLawFirms } from "@/actions/law-firms";
import { getPeople } from "@/actions/people";

import { EstateDocumentsTab, type EstateParty } from "../_components/tabs/estate-documents-tab";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EstatePlanningPage({ params }: Props) {
  const { id } = await params;
  const [clientResult, lawFirmsResult, peopleResult, companiesResult] = await Promise.all([
    getClient(id),
    getLawFirms(),
    getPeople(),
    getCompanies(),
  ]);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;

  const lawFirms = (lawFirmsResult.success ? (lawFirmsResult.lawFirms ?? []) : []).map((f) => ({
    id: f.id as string,
    name: f.firmName as string,
  }));

  const people: EstateParty[] = (peopleResult.success ? (peopleResult.people ?? []) : []).map((p) => ({
    id: p.id as string,
    name: [p.firstName, p.lastName].filter(Boolean).join(" ").trim() || "Unnamed person",
    kind: "person" as const,
  }));

  const companies: EstateParty[] = (companiesResult.success ? (companiesResult.companies ?? []) : []).map((c) => ({
    id: c.id as string,
    name: (c.name as string) || "Unnamed company",
    kind: "company" as const,
  }));

  const parties: EstateParty[] = [...people, ...companies].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="py-4">
      <EstateDocumentsTab client={client} lawFirms={lawFirms} parties={parties} useHeaderPortal={true} noCard={true} />
    </div>
  );
}
