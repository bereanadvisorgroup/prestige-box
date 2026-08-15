import { notFound } from "next/navigation";

import { ShieldAlert } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import {
  getDisabilityInsuranceCompanies,
  unlinkClientFromDisabilityInsuranceCompany,
} from "@/actions/disability-insurance-companies";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { getPeople } from "@/actions/people";
import type { BeneficiaryParty } from "@/app/(main)/dashboard/crm/clients/[id]/_components/insurance-policy-manager";
import { DisabilityInsuranceManager } from "@/app/(main)/dashboard/crm/clients/[id]/disability-insurance/_components/disability-insurance-manager";
import { AssociationCardList } from "@/components/features/crm/association-card-list";
import { formatPersonName } from "@/lib/utils";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HouseholdDisabilityInsurancePage({ params }: Props) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;
  const [allClientsRes, companiesRes, peopleResult, allCompaniesResult] = await Promise.all([
    getClients(),
    getDisabilityInsuranceCompanies(),
    getPeople(),
    getCompanies(),
  ]);

  const allClients = allClientsRes.success ? allClientsRes.clients || [] : [];
  const activeClients = allClients.filter((c) => clientIds.includes(c.id || ""));
  const allInsuranceCompanies = (companiesRes.success && companiesRes.companies) || [];

  const people: BeneficiaryParty[] = (peopleResult.success ? (peopleResult.people ?? []) : []).map((p) => ({
    id: p.id as string,
    name: formatPersonName(p, "Unnamed person"),
    kind: "person" as const,
  }));
  const companies: BeneficiaryParty[] = (allCompaniesResult.success ? (allCompaniesResult.companies ?? []) : []).map(
    (c) => ({ id: c.id as string, name: (c.name as string) || "Unnamed company", kind: "company" as const }),
  );
  const parties = [...people, ...companies].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6 py-4">
      <HouseholdHeaderPortal sectionName="Disability Insurance" />
      {activeClients.length > 0 ? (
        activeClients.map((client) => (
          <div key={client.id} className="space-y-2">
            <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              Client: {formatPersonName(client.person, client.id)}
            </h3>
            <DisabilityInsuranceManager client={client} allCompanies={allInsuranceCompanies} parties={parties} />
          </div>
        ))
      ) : (
        <AssociationCardList
          entityId={id}
          title="Associated Disability Insurance Companies"
          description="No active financial rollup clients in this household."
          items={[]}
          linkPrefix="/dashboard/crm/disability-insurance"
          icon={ShieldAlert}
          onUnlinkAction={unlinkClientFromDisabilityInsuranceCompany}
          noCard={true}
        />
      )}
    </div>
  );
}
