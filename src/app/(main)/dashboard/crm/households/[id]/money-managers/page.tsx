import { notFound } from "next/navigation";

import { TrendingUp } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getCustodians } from "@/actions/custodians";
import { getFinancialAccountTypes } from "@/actions/financial-account-types";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { getMoneyManagers, unlinkClientFromMoneyManager } from "@/actions/money-managers";
import { getPeople } from "@/actions/people";
import type { BeneficiaryParty } from "@/app/(main)/dashboard/crm/clients/[id]/_components/insurance-policy-manager";
import { MoneyManagerAccountsManager } from "@/app/(main)/dashboard/crm/clients/[id]/money-managers/_components/money-manager-accounts-manager";
import { AssociationCardList } from "@/components/features/crm/association-card-list";
import { formatPersonName } from "@/lib/utils";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HouseholdMoneyManagersPage({ params }: Props) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;
  const [allClientsRes, moneyRes, typesRes, custodiansRes, peopleResult, companiesResult] = await Promise.all([
    getClients(),
    getMoneyManagers(),
    getFinancialAccountTypes(),
    getCustodians(),
    getPeople(),
    getCompanies(),
  ]);

  const allClients = allClientsRes.success ? allClientsRes.clients || [] : [];
  const activeClients = allClients.filter((c) => clientIds.includes(c.id || ""));

  const moneyManagers = ((moneyRes.success && moneyRes.moneyManagers) || [])
    .map((mm) => ({ id: mm.id as string, name: mm.firmName as string }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const financialTypes = ((typesRes.success && typesRes.types) || []).map((t) => ({
    id: t.id as string,
    name: t.name,
  }));

  const custodians = ((custodiansRes.success && custodiansRes.custodians) || []).map((c) => ({
    id: c.id as string,
    name: c.name,
  }));

  const people: BeneficiaryParty[] = (peopleResult.success ? (peopleResult.people ?? []) : []).map((p) => ({
    id: p.id as string,
    name: formatPersonName(p, "Unnamed person"),
    kind: "person" as const,
  }));

  const companies: BeneficiaryParty[] = (companiesResult.success ? (companiesResult.companies ?? []) : []).map((c) => ({
    id: c.id as string,
    name: (c.name as string) || "Unnamed company",
    kind: "company" as const,
  }));

  const parties = [...people, ...companies].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6 py-4">
      <HouseholdHeaderPortal sectionName="Money Managers" />
      {activeClients.length > 0 ? (
        activeClients.map((client) => (
          <div key={client.id} className="space-y-2">
            <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              Client: {formatPersonName(client.person, client.id)}
            </h3>
            <MoneyManagerAccountsManager
              client={client}
              moneyManagers={moneyManagers}
              financialTypes={financialTypes}
              custodians={custodians}
              parties={parties}
            />
          </div>
        ))
      ) : (
        <AssociationCardList
          entityId={id}
          title="Associated Money Managers"
          description="No active financial rollup clients in this household."
          items={[]}
          linkPrefix="/dashboard/crm/money-managers"
          icon={TrendingUp}
          onUnlinkAction={unlinkClientFromMoneyManager}
          noCard={true}
        />
      )}
    </div>
  );
}
