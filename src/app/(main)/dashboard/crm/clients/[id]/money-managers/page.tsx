import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getCustodians } from "@/actions/custodians";
import { getFinancialAccountTypes } from "@/actions/financial-account-types";
import { getMoneyManagers } from "@/actions/money-managers";
import { getPeople } from "@/actions/people";
import { formatPersonName } from "@/lib/utils";

import type { BeneficiaryParty } from "../_components/insurance-policy-manager";
import { MoneyManagerAccountsManager } from "./_components/money-manager-accounts-manager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MoneyManagersPage({ params }: Props) {
  const { id } = await params;
  const [clientResult, moneyRes, typesRes, custodiansRes, peopleResult, companiesResult] = await Promise.all([
    getClient(id),
    getMoneyManagers(),
    getFinancialAccountTypes(),
    getCustodians(),
    getPeople(),
    getCompanies(),
  ]);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;

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
    <div className="py-4">
      <MoneyManagerAccountsManager
        client={client}
        moneyManagers={moneyManagers}
        financialTypes={financialTypes}
        custodians={custodians}
        parties={parties}
      />
    </div>
  );
}
