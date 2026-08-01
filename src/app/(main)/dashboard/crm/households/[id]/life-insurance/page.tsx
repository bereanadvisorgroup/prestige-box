import { notFound } from "next/navigation";

import { HeartHandshake } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { getLifeInsuranceCompanies, unlinkClientFromLifeInsuranceCompany } from "@/actions/life-insurance-companies";
import { getPeople } from "@/actions/people";
import type { BeneficiaryParty } from "@/app/(main)/dashboard/crm/clients/[id]/_components/insurance-policy-manager";
import { LifeInsuranceManager } from "@/app/(main)/dashboard/crm/clients/[id]/life-insurance/_components/life-insurance-manager";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HouseholdLifeInsurancePage({ params }: Props) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;
  const [allClientsRes, companiesRes, peopleResult, allCompaniesResult] = await Promise.all([
    getClients(),
    getLifeInsuranceCompanies(),
    getPeople(),
    getCompanies(),
  ]);

  const allClients = allClientsRes.success ? allClientsRes.clients || [] : [];
  const activeClients = allClients.filter((c) => clientIds.includes(c.id || ""));
  const allInsuranceCompanies = (companiesRes.success && companiesRes.companies) || [];

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
    <div className="space-y-6 py-4">
      <HouseholdHeaderPortal sectionName="Life Insurance" />
      {activeClients.length > 0 ? (
        activeClients.map((client) => (
          <div key={client.id} className="space-y-2">
            <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              Client: {client.person ? `${client.person.firstName} ${client.person.lastName}` : client.id}
            </h3>
            <LifeInsuranceManager client={client} allCompanies={allInsuranceCompanies} parties={parties} />
          </div>
        ))
      ) : (
        <AssociationCardList
          entityId={id}
          title="Associated Life Insurance Companies"
          description="No active financial rollup clients in this household."
          items={[]}
          linkPrefix="/dashboard/crm/life-insurance"
          icon={HeartHandshake}
          onUnlinkAction={unlinkClientFromLifeInsuranceCompany}
          noCard={true}
        />
      )}
    </div>
  );
}
