import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getDisabilityInsuranceCompanies } from "@/actions/disability-insurance-companies";
import { getInsuranceAgencies } from "@/actions/insurance-agencies";
import { getPeople } from "@/actions/people";

import type { BeneficiaryParty } from "../_components/insurance-policy-manager";
import { DisabilityInsuranceManager } from "./_components/disability-insurance-manager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DisabilityInsurancePage({ params }: Props) {
  const { id } = await params;
  const [clientResult, companiesRes, peopleResult, allCompaniesResult, agenciesRes] = await Promise.all([
    getClient(id),
    getDisabilityInsuranceCompanies(),
    getPeople(),
    getCompanies(),
    getInsuranceAgencies(),
  ]);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const allCompanies = (companiesRes.success && companiesRes.companies) || [];
  const insuranceAgencies = (agenciesRes.success && agenciesRes.insuranceAgencies) || [];

  const people: BeneficiaryParty[] = (peopleResult.success ? (peopleResult.people ?? []) : []).map((p) => ({
    id: p.id as string,
    name: [p.firstName, p.lastName].filter(Boolean).join(" ").trim() || "Unnamed person",
    kind: "person" as const,
  }));
  const companies: BeneficiaryParty[] = (allCompaniesResult.success ? (allCompaniesResult.companies ?? []) : []).map(
    (c) => ({ id: c.id as string, name: (c.name as string) || "Unnamed company", kind: "company" as const }),
  );
  const parties = [...people, ...companies].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="py-4">
      <DisabilityInsuranceManager
        client={client}
        allCompanies={allCompanies}
        parties={parties}
        insuranceAgencies={insuranceAgencies}
      />
    </div>
  );
}
