import { notFound } from "next/navigation";

import { ExternalLink, Trophy } from "lucide-react";

import { getClient, getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getNotes } from "@/actions/notes";
import { getPeople } from "@/actions/people";
import { getReferralTypes } from "@/actions/referral-types";
import { getSportsNews } from "@/actions/sports";
import { getTasks } from "@/actions/tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ClientHeaderPortal } from "../_components/client-header-portal";
import { InterestsCard } from "../_components/interests-card";
import { NotesCard } from "../_components/notes-card";
import { ReferralTreeCard } from "../_components/referral-tree-card";
import { ReferredByCard } from "../_components/referred-by-card";
import { SportsTeamsCard } from "../_components/sports-teams-card";
import { TasksCard } from "../_components/tasks-card";

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

  const client = {
    ...clientResult.client,
    person: clientResult.person,
  };

  // Fetch all required data for the Internal Overview dashboard
  const [allClientsResult, tasksResult, notesResult, companiesResult, peopleResult, referralTypesResult] =
    await Promise.all([
      getClients(),
      getTasks({ clientId: id }),
      getNotes({ clientId: id }),
      getCompanies(),
      getPeople(),
      getReferralTypes(),
    ]);

  const allClients = allClientsResult.success ? allClientsResult.clients || [] : [];
  const tasks = tasksResult.success && tasksResult.tasks ? tasksResult.tasks : [];
  const notes = notesResult.success && notesResult.notes ? notesResult.notes : [];
  const allCompanies = companiesResult.success ? companiesResult.companies || [] : [];
  const allPeople = peopleResult.success ? peopleResult.people || [] : [];
  const allReferralTypes = referralTypesResult.success ? referralTypesResult.referralTypes || [] : [];

  const person = clientResult.person;
  const clientName = person ? `${person.firstName || ""} ${person.lastName || ""}`.trim() : "Client";

  // Fetch news for each sports team
  const teamsNews = await Promise.all(
    (client.favoriteSportsTeams || []).map(async (team) => {
      const news = await getSportsNews(team);
      return { team, articles: news.success ? news.articles : [] };
    }),
  );

  return (
    <div className="py-4">
      <ClientHeaderPortal sectionName="Overview" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Six Cards Grid in 3x2 Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:col-span-2">
          <TasksCard clientId={id} initialTasks={tasks} />
          <NotesCard clientId={id} initialNotes={notes} />
          <InterestsCard client={client} />
          <SportsTeamsCard client={client} />
          <ReferredByCard
            client={client}
            allClients={allClients}
            allCompanies={allCompanies}
            allPeople={allPeople}
            allReferralTypes={allReferralTypes}
          />
          <ReferralTreeCard client={client} clientName={clientName} allClients={allClients} />
        </div>

        {/* Favorite Teams & News Sidebar */}
        <div className="space-y-6 lg:col-span-1">
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
