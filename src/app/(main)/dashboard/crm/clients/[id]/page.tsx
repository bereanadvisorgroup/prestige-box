import Link from "next/link";
import { notFound } from "next/navigation";

import { Building2, ExternalLink, FileText, Globe, Mail, Pencil, Phone, Trophy, User as UserIcon } from "lucide-react";

import { getClient } from "@/actions/clients";
import { getCompaniesByClient } from "@/actions/companies";
import { getClientPoliciesByClient } from "@/actions/policies";
import { getSportsNews } from "@/actions/sports";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPhoneNumber } from "@/lib/utils";
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
  const policiesResult = await getClientPoliciesByClient(id);
  const policies = (policiesResult.success ? policiesResult.policies : []) as (ClientPolicy & { id: string })[];

  const companiesResult = await getCompaniesByClient(id);
  const companies = (companiesResult.success ? companiesResult.companies : []) as (Company & { id: string })[];

  // Fetch news for each sports team
  const teamsNews = await Promise.all(
    (client.favoriteSportsTeams || []).map(async (team) => {
      const news = await getSportsNews(team);
      return { team, articles: news.success ? news.articles : [] };
    }),
  );

  return (
    <div className="fade-in mx-auto w-full max-w-7xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      {/* Header Section */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            <AvatarFallback className="bg-primary/5 text-2xl text-primary">
              {person?.firstName?.[0]}
              {person?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              {person?.firstName} {person?.lastName}
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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 border bg-muted/50 p-1 shadow-inner">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Full Profile & Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="m-0 border-0 outline-none">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Contact Info & Details */}
            <div className="space-y-6 lg:col-span-1">
              <Card className="overflow-hidden border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Email</p>
                      <p className="font-semibold text-sm">
                        {person?.emails?.find((e) => e.isPrimary)?.address || person?.emails?.[0]?.address || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Phone</p>
                      <p className="font-semibold text-sm">
                        {formatPhoneNumber(
                          person?.phones?.find((p) => p.isPrimary)?.number || person?.phones?.[0]?.number,
                        ) || "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hobbies Section */}
              {client.hobbies && client.hobbies.length > 0 && (
                <Card className="overflow-hidden border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
                  <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">Hobbies & Interests</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-2">
                      {client.hobbies.map((hobby, i) => (
                        <Badge key={i} variant="secondary" className="transition-colors hover:bg-secondary/80">
                          {hobby}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Favorite Sports Teams News Section */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-bold text-lg">
                  <Trophy className="h-5 w-5 text-yellow-600" /> Favorite Teams & News
                </h3>
                {teamsNews.length > 0 ? (
                  teamsNews.map((teamData: any, idx) => (
                    <Card key={idx} className="border-none shadow-sm transition-shadow hover:shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-3 font-semibold text-md">
                          {teamData.articles?.length > 0 && teamData.articles[0]?.thumbnail && (
                            <img
                              src={teamData.articles[0].thumbnail}
                              alt={`${teamData.team} logo`}
                              className="h-8 w-8 object-contain"
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
                                    className="h-12 w-12 shrink-0 rounded object-cover shadow-sm"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="flex items-center justify-between gap-2 font-medium text-sm transition-colors group-hover:text-primary">
                                    <span className="line-clamp-2">{article.title}</span>
                                    <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                                  </p>
                                  <p className="mt-1 text-muted-foreground text-xs">{article.source}</p>
                                </div>
                              </div>
                            </a>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-xs">No recent news found.</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm italic">No sports teams associated with this client.</p>
                )}
              </div>
            </div>

            {/* Companies & Policies Section */}
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Building2 className="h-5 w-5 text-primary" /> Associated Companies
                    </CardTitle>
                    <CardDescription>View companies this client is associated with.</CardDescription>
                  </div>
                  <Link href={`/dashboard/crm/companies/new`}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      + Add Company
                    </Badge>
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  {companies.length > 0 ? (
                    <div className="divide-y">
                      {companies.map((company) => (
                        <Link
                          key={company.id}
                          href={`/dashboard/crm/companies/${company.id}`}
                          className="group block flex items-center justify-between p-4 transition-colors hover:bg-muted/5"
                        >
                          <div className="space-y-1">
                            <p className="font-semibold transition-colors group-hover:text-primary">{company.name}</p>
                            <p className="flex items-center gap-2 text-muted-foreground text-xs">
                              {company.website && (
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" /> {company.website.replace(/^https?:\/\//, "")}
                                </span>
                              )}
                              {company.website && company.phone && <span>•</span>}
                              {company.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {formatPhoneNumber(company.phone)}
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
                      <p className="text-sm">No companies associated with this client.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FileText className="h-5 w-5 text-primary" /> Associated Policies
                    </CardTitle>
                    <CardDescription>Manage and view all insurance policies for this client.</CardDescription>
                  </div>
                  <Link href={`/dashboard/crm/policies/new?clientId=${id}`}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
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
                          className="flex items-center justify-between p-4 transition-colors hover:bg-muted/5"
                        >
                          <div className="space-y-1">
                            <p className="font-semibold">{policy.policyName}</p>
                            <p className="text-muted-foreground text-xs">#{policy.policyNumber}</p>
                          </div>
                          <div className="space-y-1 text-right">
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
                      <FileText className="mx-auto mb-4 h-12 w-12 opacity-20" />
                      <p>No policies found for this client.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="m-0 border-0 outline-none">
          <ClientProfileTabs client={client} person={person} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
