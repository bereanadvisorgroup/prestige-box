import Link from "next/link";
import { notFound } from "next/navigation";

import { ExternalLink, FileText, Mail, MapPin, Pencil, Phone, Trophy, User as UserIcon } from "lucide-react";

import { getClient } from "@/actions/clients";
import { getClientPoliciesByClient } from "@/actions/policies";
import { getSportsNews } from "@/actions/sports";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ClientPolicy, Person } from "@/types/crm";

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
  const policiesResult = await getClientPoliciesByClient(id);
  const policies = (policiesResult.success ? policiesResult.policies : []) as (ClientPolicy & { id: string })[];

  // Fetch news for each sports team
  const teamsNews = await Promise.all(
    (client.favoriteSportsTeams || []).map(async (team) => {
      const news = await getSportsNews(team);
      return { team, articles: news.success ? news.articles : [] };
    }),
  );

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 md:px-6 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            <AvatarFallback className="text-2xl bg-primary/5 text-primary">
              {person?.firstName?.[0]}
              {person?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {person?.firstName} {person?.lastName}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <UserIcon className="h-4 w-4" /> Client ID: {client.id}
            </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info & Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-none shadow-md bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                  <p className="text-sm font-semibold">{person?.email || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-semibold">{person?.mobilePhone || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hobbies Section */}
          {client.hobbies && client.hobbies.length > 0 && (
            <Card className="overflow-hidden border-none shadow-md bg-gradient-to-b from-card to-muted/20">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">Hobbies & Interests</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  {client.hobbies.map((hobby, i) => (
                    <Badge key={i} variant="secondary" className="hover:bg-secondary/80 transition-colors">
                      {hobby}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Favorite Sports Teams News Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" /> Favorite Teams & News
            </h3>
            {teamsNews.length > 0 ? (
              teamsNews.map((teamData: any, idx) => (
                <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-semibold flex items-center gap-3">
                      {teamData.articles?.length > 0 && teamData.articles[0]?.thumbnail && (
                        <img
                          src={teamData.articles[0].thumbnail}
                          alt={`${teamData.team} logo`}
                          className="w-8 h-8 object-contain"
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
                          className="group block space-y-1 p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex gap-3 items-start">
                            {article.thumbnail && (
                              <img
                                src={article.thumbnail}
                                alt=""
                                className="w-12 h-12 object-cover rounded shadow-sm shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium group-hover:text-primary transition-colors flex items-center justify-between gap-2">
                                <span className="line-clamp-2">{article.title}</span>
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">{article.source}</p>
                            </div>
                          </div>
                        </a>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No recent news found.</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">No sports teams associated with this client.</p>
            )}
          </div>
        </div>

        {/* Policies Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Associated Policies
                </CardTitle>
                <CardDescription>Manage and view all insurance policies for this client.</CardDescription>
              </div>
              <Link href={`/dashboard/crm/policies/new?clientId=${id}`}>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  + Add Policy
                </Badge>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {policies.length > 0 ? (
                <div className="divide-y">
                  {policies.map((policy) => (
                    <div
                      key={policy.id}
                      className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold">{policy.policyName}</p>
                        <p className="text-xs text-muted-foreground">#{policy.policyNumber}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-medium">${policy.premiumAmount.toLocaleString()}</p>
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {policy.paymentSchedule}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No policies found for this client.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
