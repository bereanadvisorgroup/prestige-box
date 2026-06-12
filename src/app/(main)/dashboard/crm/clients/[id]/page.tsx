import Link from "next/link";
import { notFound } from "next/navigation";

import { Pencil } from "lucide-react";

import { getAccountingFirms } from "@/actions/accounting-firms";
import { getActuarialFirms } from "@/actions/actuarial-firms";
import { getBanks } from "@/actions/banks";
import { getClient, getClients } from "@/actions/clients";
import { getCompaniesByClient } from "@/actions/companies";
import { getDisabilityInsuranceCompanies } from "@/actions/disability-insurance-companies";
import { getLawFirms } from "@/actions/law-firms";
import { getLifeInsuranceCompanies } from "@/actions/life-insurance-companies";
import { getLongTermCareInsurances } from "@/actions/long-term-care-insurance";
import { getMoneyManagers } from "@/actions/money-managers";
import { getClientPoliciesByClient } from "@/actions/policies";
import { getPropertyAndCasualtyFirms } from "@/actions/property-and-casualty";
import { getRecordKeepers } from "@/actions/record-keepers";
import { getSportsNews } from "@/actions/sports";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ClientPolicy, Company, Person } from "@/types/crm";

import { ClientProfileTabs } from "./_components/client-profile-tabs";

interface ClientPageProps {
  params: {
    id: string;
  };
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const person = clientResult.person as Person | null;

  // Fetch all associated entities
  const [
    policiesResult,
    companiesResult,
    lawFirmsRes,
    accountingFirmsRes,
    actuarialFirmsRes,
    banksRes,
    propertyAndCasualtyFirmsRes,
    lifeRes,
    disabilityRes,
    ltcRes,
    moneyRes,
    recordRes,
    allClientsResult,
  ] = await Promise.all([
    getClientPoliciesByClient(id),
    getCompaniesByClient(id),
    getLawFirms(),
    getAccountingFirms(),
    getActuarialFirms(),
    getBanks(),
    getPropertyAndCasualtyFirms(),
    getLifeInsuranceCompanies(),
    getDisabilityInsuranceCompanies(),
    getLongTermCareInsurances(),
    getMoneyManagers(),
    getRecordKeepers(),
    getClients(),
  ]);

  const policies = (policiesResult.success ? policiesResult.policies : []) as (ClientPolicy & { id: string })[];
  const companies = (companiesResult.success ? companiesResult.companies : []) as (Company & { id: string })[];

  // Filter professional services by client.id
  const associatedLawFirms = ((lawFirmsRes.success && lawFirmsRes.lawFirms) || []).filter((l) =>
    l.clientIds?.includes(client.id!),
  );
  const associatedAccountingFirms = ((accountingFirmsRes.success && accountingFirmsRes.accountingFirms) || []).filter(
    (a) => a.clientIds?.includes(client.id!),
  );
  const associatedActuarialFirms = ((actuarialFirmsRes.success && actuarialFirmsRes.actuarialFirms) || []).filter(
    (act) => act.clientIds?.includes(client.id!),
  );
  const associatedBanks = ((banksRes.success && banksRes.banks) || []).filter((b) => b.clientIds?.includes(client.id!));
  const associatedPropertyAndCasualties = (
    (propertyAndCasualtyFirmsRes.success && propertyAndCasualtyFirmsRes.propertyAndCasualtyFirms) ||
    []
  ).filter((pc) => pc.clientIds?.includes(client.id!));

  // Filter money managers and record keepers by clientIds array
  const associatedMoneyManagers = ((moneyRes.success && moneyRes.moneyManagers) || []).filter((mm) =>
    mm.clientIds?.includes(client.id!),
  );
  const associatedRecordKeepers = ((recordRes.success && recordRes.recordKeepers) || []).filter((rk) =>
    rk.clientIds?.includes(client.id!),
  );

  // Filter insurance vendors by checking if their ID is referenced in client policies
  const policyLifeIds = new Set(policies.map((p) => p.lifeInsuranceCompanyId).filter(Boolean));
  const policyDisabilityIds = new Set(policies.map((p) => p.disabilityInsuranceCompanyId).filter(Boolean));
  const policyLtcIds = new Set(policies.map((p) => p.longTermCareInsuranceId).filter(Boolean));

  const associatedLife = ((lifeRes.success && lifeRes.companies) || []).filter((c) => policyLifeIds.has(c.id!));
  const associatedDisability = ((disabilityRes.success && disabilityRes.companies) || []).filter((c) =>
    policyDisabilityIds.has(c.id!),
  );
  const associatedLtc = ((ltcRes.success && ltcRes.companies) || []).filter((c) => policyLtcIds.has(c.id!));

  // Fetch news for each sports team
  const teamsNews = await Promise.all(
    (client.favoriteSportsTeams || []).map(async (team) => {
      const news = await getSportsNews(team);
      return { team, articles: news.success ? news.articles : [] };
    }),
  );

  const initials = `${person?.firstName?.[0] || ""}${person?.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="fade-in mx-auto w-full max-w-7xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      {/* Header Section */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            {person?.photoUrl && (
              <AvatarImage
                src={person.photoUrl}
                alt={`${person.firstName} ${person.lastName}`}
                className="object-cover"
              />
            )}
            <AvatarFallback className="bg-primary/5 text-2xl text-primary">{initials || "CL"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              {person ? `${person.firstName} ${person.lastName}` : "Client Profile"}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/crm/clients/${id}/edit`}>
            <Button>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Client
            </Button>
          </Link>
        </div>
      </div>

      <ClientProfileTabs
        client={client}
        person={person}
        allClients={allClientsResult.success ? allClientsResult.clients : []}
        associatedCompanies={companies}
        associatedPolicies={policies}
        teamsNews={teamsNews}
        associatedLawFirms={associatedLawFirms}
        associatedAccountingFirms={associatedAccountingFirms}
        associatedActuarialFirms={associatedActuarialFirms}
        associatedBanks={associatedBanks}
        associatedPropertyAndCasualties={associatedPropertyAndCasualties}
        associatedLife={associatedLife}
        associatedDisability={associatedDisability}
        associatedLtc={associatedLtc}
        associatedMoneyManagers={associatedMoneyManagers}
        associatedRecordKeepers={associatedRecordKeepers}
      />
    </div>
  );
}
