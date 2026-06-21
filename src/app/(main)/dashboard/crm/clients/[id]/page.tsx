import Link from "next/link";
import { notFound } from "next/navigation";

import { Building2, ExternalLink, FileText, Globe, Phone, Trophy } from "lucide-react";

import { getClientAssetHistory } from "@/actions/assets";
import { getClient, getClients } from "@/actions/clients";
import { getCompaniesByClient } from "@/actions/companies";
import { getPerson } from "@/actions/people";
import { getClientPoliciesByClient } from "@/actions/policies";
import { getSportsNews } from "@/actions/sports";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/utils";
import type { ClientPolicy, Company } from "@/types/crm";

import { ContactCard } from "./_components/contact-card";
import { NetWorthGraph } from "./_components/net-worth-graph";
import { PersonalInfoCard } from "./_components/personal-info-card";
import { GeneralTab } from "./_components/tabs/general-tab";

interface ClientPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;

  // Fetch only the entities required for the General page
  const [companiesResult, policiesResult, allClientsResult, historyResult, personResult] = await Promise.all([
    getCompaniesByClient(id),
    getClientPoliciesByClient(id),
    getClients(),
    getClientAssetHistory(id),
    getPerson(client.personId),
  ]);

  const companies = (companiesResult.success ? companiesResult.companies : []) as (Company & { id: string })[];
  const policies = (policiesResult.success ? policiesResult.policies : []) as (ClientPolicy & { id: string })[];
  const allClients = allClientsResult.success ? allClientsResult.clients : [];
  const historyData = historyResult.success && historyResult.historyData ? historyResult.historyData : [];
  const person = personResult.success && personResult.person ? personResult.person : null;

  // Fetch news for each sports team
  const teamsNews = await Promise.all(
    (client.favoriteSportsTeams || []).map(async (team) => {
      const news = await getSportsNews(team);
      return { team, articles: news.success ? news.articles : [] };
    }),
  );

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-8">
        {person && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <ContactCard person={person} />
            <PersonalInfoCard person={person} clientId={id} />
          </div>
        )}
        <NetWorthGraph historyData={historyData} />
      </div>
    </div>
  );
}
