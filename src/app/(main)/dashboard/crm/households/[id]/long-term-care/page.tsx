import { notFound } from "next/navigation";

import { HeartPulse } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { getLongTermCareInsurances, unlinkClientFromLongTermCareInsurance } from "@/actions/long-term-care-insurance";
import { getPeople } from "@/actions/people";
import type { BeneficiaryParty } from "@/app/(main)/dashboard/crm/clients/[id]/_components/insurance-policy-manager";
import { LongTermCareManager } from "@/app/(main)/dashboard/crm/clients/[id]/long-term-care/_components/long-term-care-manager";
import { AssociationCardList } from "@/components/features/crm/association-card-list";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HouseholdLongTermCarePage({ params }: Props) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;
  const [allClientsRes, companiesRes, peopleResult, allCompaniesResult] = await Promise.all([
    getClients(),
    getLongTermCareInsurances(),
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
      <HouseholdHeaderPortal sectionName="Long Term Care" />
      {activeClients.length > 0 ? (
        activeClients.map((client) => (
          <div key={client.id} className="space-y-2">
            <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              Client: {client.person ? `${client.person.firstName} ${client.person.lastName}` : client.id}
            </h3>
            <LongTermCareManager client={client} allCompanies={allInsuranceCompanies} parties={parties} />
          </div>
        ))
      ) : (
        <AssociationCardList
          entityId={id}
          title="Associated Long Term Care Insurance Companies"
          description="No active financial rollup clients in this household."
          items={[]}
          linkPrefix="/dashboard/crm/long-term-care"
          icon={HeartPulse}
          onUnlinkAction={unlinkClientFromLongTermCareInsurance}
          noCard={true}
        />
      )}
    </div>
  );
}
