import { notFound } from "next/navigation";

import { ExternalLink, Trophy } from "lucide-react";

import { getClient, getClients } from "@/actions/clients";
import { getCompaniesByClient } from "@/actions/companies";
import { getClientPoliciesByClient } from "@/actions/policies";
import { getSportsNews } from "@/actions/sports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientPolicy, Company } from "@/types/crm";

import { GeneralTab } from "../_components/tabs/general-tab";

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
  const [companiesResult, policiesResult, allClientsResult] = await Promise.all([
    getCompaniesByClient(id),
    getClientPoliciesByClient(id),
    getClients(),
  ]);

  const companies = (companiesResult.success ? companiesResult.companies : []) as (Company & { id: string })[];
  const policies = (policiesResult.success ? policiesResult.policies : []) as (ClientPolicy & { id: string })[];
  const allClients = allClientsResult.success ? allClientsResult.clients : [];

  // Fetch news for each sports team
  const teamsNews = await Promise.all(
    (client.favoriteSportsTeams || []).map(async (team) => {
      const news = await getSportsNews(team);
      return { team, articles: news.success ? news.articles : [] };
    }),
  );

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Preferences / Editing */}
        <div className="space-y-6 lg:col-span-2">
          <GeneralTab client={client} allClients={allClients} />
        </div>

        {/* Companies, Policies, and Sports News */}
        <div className="space-y-6 lg:col-span-1">
          {/* Favorite Teams & News */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-bold text-base">
              <Trophy className="h-4 w-4 text-yellow-600" /> Favorite Teams & News
            </h3>
            {teamsNews && teamsNews.length > 0 ? (
              teamsNews.map((teamData: any, idx: number) => (
                <Card key={idx} className="border-none shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-3 font-semibold text-sm">
                      {teamData.articles?.length > 0 && teamData.articles[0]?.thumbnail && (
                        <img
                          src={teamData.articles[0].thumbnail}
                          alt={`${teamData.team} logo`}
                          className="h-6 w-6 object-contain"
                        />
                      )}
                      <span>{teamData.team}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {teamData.articles && teamData.articles.length > 0 ? (
                      teamData.articles.slice(0, 3).map((article: any, i: number) => (
                        <a
                          key={i}
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group -mx-2 block space-y-1 rounded-md p-2 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-start gap-3">
                            {article.thumbnail && (
                              <img
                                src={article.thumbnail}
                                alt=""
                                className="h-10 w-10 shrink-0 rounded object-cover shadow-sm"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="flex items-start justify-between gap-2 font-medium text-xs transition-colors group-hover:text-primary">
                                <span className="line-clamp-2">{article.title}</span>
                                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                              </p>
                              <p className="mt-1 text-[10px] text-muted-foreground">{article.source}</p>
                            </div>
                          </div>
                        </a>
                      ))
                    ) : (
                      <p className="text-[10px] text-muted-foreground">No recent news found.</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground text-sm italic">No sports teams associated with this client.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
