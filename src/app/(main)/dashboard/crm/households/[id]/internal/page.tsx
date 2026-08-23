import Link from "next/link";
import { notFound } from "next/navigation";

import { Pencil, Trophy } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getEvents } from "@/actions/events";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { getNotes } from "@/actions/notes";
import { getPeople } from "@/actions/people";
import { getReferralTypes } from "@/actions/referral-types";
import { getSportsNews } from "@/actions/sports";
import { getTasks } from "@/actions/tasks";
import { getTeams } from "@/actions/teams";
import { getAdvisors } from "@/actions/users";
import { getWorkflows } from "@/actions/workflows";
import { InterestsCard } from "@/app/(main)/dashboard/crm/clients/[id]/_components/interests-card";
import { NotesCard } from "@/app/(main)/dashboard/crm/clients/[id]/_components/notes-card";
import { ReferralTreeCard } from "@/app/(main)/dashboard/crm/clients/[id]/_components/referral-tree-card";
import { ReferredByCard } from "@/app/(main)/dashboard/crm/clients/[id]/_components/referred-by-card";
import { SportsTeamsCard } from "@/app/(main)/dashboard/crm/clients/[id]/_components/sports-teams-card";
import { TasksCard } from "@/app/(main)/dashboard/crm/clients/[id]/_components/tasks-card";
import { WorkflowStepsCard } from "@/app/(main)/dashboard/crm/clients/[id]/_components/workflow-steps-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface HouseholdInternalPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HouseholdInternalPage({ params }: HouseholdInternalPageProps) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { household, clientIds } = activeRes;
  const primaryClientId = clientIds[0] || "";

  // Fetch all required combined data for active rollup clients
  const [
    allClientsResult,
    tasksResult,
    notesResult,
    companiesResult,
    peopleResult,
    referralTypesResult,
    eventsResult,
    advisorsResult,
    workflowsResult,
    teamsResult,
  ] = await Promise.all([
    getClients(),
    getTasks({ clientIds }),
    getNotes({ clientIds }),
    getCompanies(),
    getPeople(),
    getReferralTypes(),
    getEvents(),
    getAdvisors(),
    getWorkflows("client", clientIds),
    getTeams(),
  ]);

  const allClients = allClientsResult.success ? allClientsResult.clients || [] : [];
  const tasks = tasksResult.success && tasksResult.tasks ? tasksResult.tasks : [];
  const notes = notesResult.success && notesResult.notes ? notesResult.notes : [];
  const allCompanies = companiesResult.success ? companiesResult.companies || [] : [];
  const allPeople = peopleResult.success ? peopleResult.people || [] : [];
  const allReferralTypes = referralTypesResult.success ? referralTypesResult.referralTypes || [] : [];
  const allEvents = eventsResult.success ? eventsResult.events || [] : [];
  const allAdvisors = advisorsResult.success ? advisorsResult.advisors || [] : [];
  const workflows = workflowsResult.success && workflowsResult.workflows ? workflowsResult.workflows : [];
  const teams = teamsResult.success ? teamsResult.teams || [] : [];

  // Filter and sort outstanding workflow steps across active rollup clients
  const outstandingSteps = workflows.flatMap((w) =>
    (w.steps || [])
      .filter((s) => !s.completedAt)
      .map((s) => ({
        ...s,
        workflowName: w.name,
        workflowId: w.id,
      })),
  );

  outstandingSteps.sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Extract combined interests and sports teams across active rollup clients
  const activeClientObjs = allClients.filter((c) => clientIds.includes(c.id || ""));
  const combinedSportsTeams = Array.from(new Set(activeClientObjs.flatMap((c) => c.favoriteSportsTeams || [])));
  const primaryClient = activeClientObjs[0] || ({} as (typeof activeClientObjs)[0]);

  // Fetch news for favorite sports teams
  const teamsNews = await Promise.all(
    combinedSportsTeams.map(async (team) => {
      const news = await getSportsNews(team);
      return { team, articles: news.success ? news.articles : [] };
    }),
  );

  return (
    <div className="space-y-6 py-4">
      <HouseholdHeaderPortal sectionName="Internal Overview">
        <Link href={`/dashboard/crm/households/${household.id}/edit`}>
          <Button size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Household
          </Button>
        </Link>
      </HouseholdHeaderPortal>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Six Cards Grid in 3x2 Layout */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-2">
          <TasksCard clientId={primaryClientId} initialTasks={tasks} />
          <NotesCard clientId={primaryClientId} initialNotes={notes} />
          <div className="md:col-span-2">
            <WorkflowStepsCard clientId={primaryClientId} steps={outstandingSteps} teams={teams} />
          </div>
          <InterestsCard
            client={{
              ...primaryClient,
              hobbies: Array.from(new Set(activeClientObjs.flatMap((c) => c.hobbies || []))),
            }}
          />
          <SportsTeamsCard
            client={{
              ...primaryClient,
              favoriteSportsTeams: combinedSportsTeams,
            }}
          />
          <ReferredByCard
            client={primaryClient}
            allClients={allClients}
            allCompanies={allCompanies}
            allPeople={allPeople}
            allReferralTypes={allReferralTypes}
            allEvents={allEvents}
            allAdvisors={allAdvisors}
          />
          <ReferralTreeCard
            client={primaryClient}
            clientName={household.name}
            allClients={allClients}
            allAdvisors={allAdvisors}
          />
        </div>

        {/* Favorite Teams & News Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-bold text-base">
              <Trophy className="h-4 w-4 text-yellow-600" /> Favorite Teams & News
            </h3>
            {teamsNews && teamsNews.length > 0 ? (
              teamsNews.map((teamData, idx) => (
                <Card
                  key={teamData.team || `team-${idx}`}
                  className="border-none shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-3 font-semibold text-sm">
                      {(teamData.articles?.length ?? 0) > 0 && teamData.articles?.[0]?.thumbnail && (
                        // biome-ignore lint/performance/noImgElement: Sports team logo
                        <img
                          src={teamData.articles?.[0]?.thumbnail}
                          alt={`${teamData.team} logo`}
                          className="h-6 w-6 object-contain"
                        />
                      )}
                      <span>{teamData.team}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {teamData.articles && teamData.articles.length > 0 ? (
                      teamData.articles.slice(0, 3).map((article, i) => (
                        <a
                          key={article.url || `art-${i}`}
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group -mx-2 block space-y-1 rounded-md p-2 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-start gap-3">
                            {article.thumbnail && (
                              // biome-ignore lint/performance/noImgElement: News article thumbnail
                              <img
                                src={article.thumbnail}
                                alt=""
                                className="h-10 w-10 shrink-0 rounded object-cover shadow-sm"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="flex items-start justify-between gap-2 font-medium text-xs transition-colors group-hover:text-primary">
                                <span className="line-clamp-2">{article.title}</span>
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
              <p className="text-muted-foreground text-sm italic">No sports teams associated with household members.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
