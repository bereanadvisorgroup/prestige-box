"use client";

import Link from "next/link";

import {
  ArrowUpRight,
  Building2,
  Calculator,
  Database,
  ExternalLink,
  FileText,
  Globe,
  HeartHandshake,
  HeartPulse,
  Landmark,
  Phone,
  ReceiptText,
  Scale,
  Shield,
  ShieldAlert,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPhoneNumber } from "@/lib/utils";
import type {
  AccountingFirm,
  ActuarialFirm,
  Bank,
  Client,
  ClientPolicy,
  Company,
  DisabilityInsuranceCompany,
  LawFirm,
  LifeInsuranceCompany,
  LongTermCareInsurance,
  MoneyManager,
  Person,
  PropertyAndCasualtyFirm,
  RecordKeeper,
} from "@/types/crm";

import { DocumentsTab } from "./tabs/documents-tab";
import { EmploymentTab } from "./tabs/employment-tab";
import { FamilyTab } from "./tabs/family-tab";
import { GeneralTab } from "./tabs/general-tab";
import { LiabilitiesTab } from "./tabs/liabilities-tab";
import { MortgageTab } from "./tabs/mortgage-tab";
import { PersonalTab } from "./tabs/personal-tab";

interface ClientProfileTabsProps {
  client: Client;
  person: Person | null;
  associatedCompanies: (Company & { id: string })[];
  associatedPolicies: (ClientPolicy & { id: string })[];
  teamsNews: any[];
  associatedLawFirms: LawFirm[];
  associatedAccountingFirms: AccountingFirm[];
  associatedActuarialFirms: ActuarialFirm[];
  associatedBanks: Bank[];
  associatedPropertyAndCasualties: PropertyAndCasualtyFirm[];
  associatedLife: LifeInsuranceCompany[];
  associatedDisability: DisabilityInsuranceCompany[];
  associatedLtc: LongTermCareInsurance[];
  associatedMoneyManagers: MoneyManager[];
  associatedRecordKeepers: RecordKeeper[];
}

function AssociationCardList({
  title,
  description,
  items,
  linkPrefix,
  icon: Icon,
}: {
  title: string;
  description: string;
  items: { id: string; name: string; website?: string | null; phone?: string | null }[];
  linkPrefix: string;
  icon: any;
}) {
  return (
    <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
      <CardHeader className="bg-muted/10 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5 text-primary" /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/5 shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                  <Link href={`${linkPrefix}/${item.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                {item.website && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    <a
                      href={item.website.startsWith("http") ? item.website : `https://${item.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-blue-600 dark:text-blue-400"
                    >
                      {item.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                {item.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{formatPhoneNumber(item.phone)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientProfileTabs({
  client,
  person,
  associatedCompanies,
  associatedPolicies,
  teamsNews,
  associatedLawFirms,
  associatedAccountingFirms,
  associatedActuarialFirms,
  associatedBanks,
  associatedPropertyAndCasualties,
  associatedLife,
  associatedDisability,
  associatedLtc,
  associatedMoneyManagers,
  associatedRecordKeepers,
}: ClientProfileTabsProps) {
  return (
    <div className="fade-in col-span-1 w-full animate-in duration-500 lg:col-span-3">
      <Tabs defaultValue="general" className="w-full">
        <div className="hide-scrollbar -mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          <TabsList className="inline-flex h-12 min-w-max items-center justify-start rounded-lg border bg-muted/50 p-1.5 text-muted-foreground shadow-inner">
            <TabsTrigger
              value="general"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="personal"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Personal
            </TabsTrigger>
            <TabsTrigger
              value="family"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Family
            </TabsTrigger>
            <TabsTrigger
              value="employment"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Employment
            </TabsTrigger>
            <TabsTrigger
              value="estate"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Estate Planning
            </TabsTrigger>
            <TabsTrigger
              value="liabilities"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Liabilities
            </TabsTrigger>
            <TabsTrigger
              value="professional-services"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Associated Professional Services
            </TabsTrigger>
            <TabsTrigger
              value="vendors"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Associated Vendors
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-background/50 shadow-sm backdrop-blur-sm">
          {/* General Tab */}
          <TabsContent value="general" className="m-0 border-0 p-4 outline-none md:p-6 lg:p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Preferences / Editing */}
              <div className="lg:col-span-2 space-y-6">
                <GeneralTab client={client} />
              </div>

              {/* Companies, Policies, and Sports News */}
              <div className="space-y-6 lg:col-span-1">
                {/* Associated Companies */}
                <Card className="border-none shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-4 w-4 text-primary" /> Associated Companies
                      </CardTitle>
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
                    {associatedCompanies.length > 0 ? (
                      <div className="divide-y">
                        {associatedCompanies.map((company) => (
                          <Link
                            key={company.id}
                            href={`/dashboard/crm/companies/${company.id}`}
                            className="group block flex items-center justify-between p-4 transition-colors hover:bg-muted/5"
                          >
                            <div className="space-y-1">
                              <p className="font-semibold text-sm transition-colors group-hover:text-primary">
                                {company.name}
                              </p>
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
                      <div className="p-6 text-center text-muted-foreground">
                        <Building2 className="mx-auto mb-2 h-8 w-8 opacity-20" />
                        <p className="text-sm">No companies associated with this client.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Associated Policies */}
                <Card className="border-none shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-4 w-4 text-primary" /> Associated Policies
                      </CardTitle>
                    </div>
                    <Link href={`/dashboard/crm/policies/new?clientId=${client.id}`}>
                      <Badge
                        variant="outline"
                        className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        + Add Policy
                      </Badge>
                    </Link>
                  </CardHeader>
                  <CardContent className="p-0">
                    {associatedPolicies.length > 0 ? (
                      <div className="divide-y">
                        {associatedPolicies.map((policy) => (
                          <div
                            key={policy.id}
                            className="flex items-center justify-between p-4 transition-colors hover:bg-muted/5 text-sm"
                          >
                            <div className="space-y-1">
                              <p className="font-semibold">{policy.policyName}</p>
                              <p className="text-muted-foreground text-xs">#{policy.policyNumber}</p>
                            </div>
                            <div className="space-y-1 text-right">
                              <p className="font-medium">${policy.premiumAmount.toLocaleString()}</p>
                              <Badge variant="secondary" className="text-[9px] uppercase px-1 py-0">
                                {policy.paymentSchedule}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">
                        <FileText className="mx-auto mb-2 h-8 w-8 opacity-20" />
                        <p className="text-sm">No policies found for this client.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

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
                                    <p className="mt-1 text-muted-foreground text-[10px]">{article.source}</p>
                                  </div>
                                </div>
                              </a>
                            ))
                          ) : (
                            <p className="text-muted-foreground text-[10px]">No recent news found.</p>
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
          </TabsContent>

          {/* Personal Tab */}
          <TabsContent value="personal" className="m-0 border-0 p-4 outline-none md:p-6 lg:p-8">
            {person ? (
              <PersonalTab person={person} />
            ) : (
              <p className="p-8 text-center text-muted-foreground italic">No person linked to this client.</p>
            )}
          </TabsContent>

          {/* Family Tab */}
          <TabsContent value="family" className="m-0 border-0 bg-muted/5 p-4 outline-none md:p-6 lg:p-8">
            <FamilyTab client={client} />
          </TabsContent>

          {/* Employment Tab */}
          <TabsContent value="employment" className="m-0 border-0 bg-muted/5 p-4 outline-none md:p-6 lg:p-8">
            <EmploymentTab client={client} />
          </TabsContent>

          {/* Estate Planning Tab */}
          <TabsContent value="estate" className="m-0 border-0 bg-muted/5 p-4 outline-none md:p-6 lg:p-8">
            <DocumentsTab
              client={client}
              category="estateDocuments"
              title="Estate Planning Documents"
              types={["Will", "Revocable Trust", "Irrevocable Trust", "Other"]}
            />
          </TabsContent>

          {/* Liabilities Tab */}
          <TabsContent value="liabilities" className="m-0 border-0 bg-muted/5 p-4 outline-none md:p-6 lg:p-8 space-y-8">
            <LiabilitiesTab client={client} />
            {person && <MortgageTab client={client} person={person} />}
          </TabsContent>

          {/* Associated Professional Services Tab */}
          <TabsContent value="professional-services" className="m-0 border-0 bg-muted/5 p-4 outline-none md:p-6 lg:p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {associatedLawFirms.length > 0 && (
                  <AssociationCardList
                    title="Associated Law Firms"
                    description="Law firms this client is associated with"
                    items={associatedLawFirms.map((f) => ({
                      id: f.id!,
                      name: f.firmName,
                      website: f.website,
                      phone: f.phone,
                    }))}
                    linkPrefix="/dashboard/crm/law-firms"
                    icon={Scale}
                  />
                )}

                {associatedAccountingFirms.length > 0 && (
                  <AssociationCardList
                    title="Associated Accounting Firms"
                    description="Accounting firms this client is associated with"
                    items={associatedAccountingFirms.map((f) => ({
                      id: f.id!,
                      name: f.firmName,
                      website: f.website,
                      phone: f.phone,
                    }))}
                    linkPrefix="/dashboard/crm/accounting-firms"
                    icon={ReceiptText}
                  />
                )}

                {associatedActuarialFirms.length > 0 && (
                  <AssociationCardList
                    title="Associated Actuarial Firms"
                    description="Actuarial firms this client is associated with"
                    items={associatedActuarialFirms.map((f) => ({
                      id: f.id!,
                      name: f.firmName,
                      website: f.website,
                      phone: f.phone,
                    }))}
                    linkPrefix="/dashboard/crm/actuarial-firms"
                    icon={Calculator}
                  />
                )}

                {associatedBanks.length > 0 && (
                  <AssociationCardList
                    title="Associated Banks"
                    description="Banks this client is associated with"
                    items={associatedBanks.map((f) => ({
                      id: f.id!,
                      name: f.firmName,
                      website: f.website,
                      phone: f.phone,
                    }))}
                    linkPrefix="/dashboard/crm/banks"
                    icon={Landmark}
                  />
                )}

                {associatedPropertyAndCasualties.length > 0 && (
                  <AssociationCardList
                    title="Associated Property & Casualty Firms"
                    description="Property and Casualty firms this client is associated with"
                    items={associatedPropertyAndCasualties.map((f) => ({
                      id: f.id!,
                      name: f.firmName,
                      website: f.website,
                      phone: f.phone,
                    }))}
                    linkPrefix="/dashboard/crm/property-and-casualty"
                    icon={Shield}
                  />
                )}

                {associatedLawFirms.length === 0 &&
                  associatedAccountingFirms.length === 0 &&
                  associatedActuarialFirms.length === 0 &&
                  associatedBanks.length === 0 &&
                  associatedPropertyAndCasualties.length === 0 && (
                    <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
                      <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
                      <p className="text-sm italic">No associated professional services found.</p>
                    </Card>
                  )}
              </div>

              <div className="lg:col-span-1">
                <DocumentsTab
                  client={client}
                  category="pcDocuments"
                  title="Property & Casualty Documents"
                  types={[
                    "Home Declaration Page",
                    "Automobile Declaration Page",
                    "Umbrella Declaration Page",
                    "Flood Declaration Page",
                    "Collections Declaration Page",
                    "Boat/RV Declaration Page",
                    "Elevation Certificate",
                    "Wind Mitigation",
                    "4 Point Inspection",
                    "Other",
                  ]}
                />
              </div>
            </div>
          </TabsContent>

          {/* Associated Vendors Tab */}
          <TabsContent value="vendors" className="m-0 border-0 bg-muted/5 p-4 outline-none md:p-6 lg:p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {associatedLife.length > 0 && (
                  <AssociationCardList
                    title="Associated Life Insurance Companies"
                    description="Life insurance companies this client is associated with via policies"
                    items={associatedLife.map((c) => ({
                      id: c.id!,
                      name: c.name,
                      website: c.websiteUrl,
                      phone: c.phone,
                    }))}
                    linkPrefix="/dashboard/admin/life-insurance-companies"
                    icon={HeartHandshake}
                  />
                )}

                {associatedDisability.length > 0 && (
                  <AssociationCardList
                    title="Associated Disability Insurance Companies"
                    description="Disability insurance companies this client is associated with via policies"
                    items={associatedDisability.map((c) => ({
                      id: c.id!,
                      name: c.name,
                      website: c.websiteUrl,
                      phone: c.phone,
                    }))}
                    linkPrefix="/dashboard/admin/disability-insurance-companies"
                    icon={ShieldAlert}
                  />
                )}

                {associatedLtc.length > 0 && (
                  <AssociationCardList
                    title="Associated Long Term Care Insurance"
                    description="Long term care insurance companies this client is associated with via policies"
                    items={associatedLtc.map((c) => ({
                      id: c.id!,
                      name: c.name,
                      website: c.websiteUrl,
                      phone: c.phone,
                    }))}
                    linkPrefix="/dashboard/admin/long-term-care-insurance"
                    icon={HeartPulse}
                  />
                )}

                {associatedMoneyManagers.length > 0 && (
                  <AssociationCardList
                    title="Associated Money Managers"
                    description="Money managers this client is associated with"
                    items={associatedMoneyManagers.map((c) => ({
                      id: c.id!,
                      name: c.firmName,
                      website: c.website,
                      phone: c.phone,
                    }))}
                    linkPrefix="/dashboard/admin/money-managers"
                    icon={TrendingUp}
                  />
                )}

                {associatedRecordKeepers.length > 0 && (
                  <AssociationCardList
                    title="Associated Record Keepers"
                    description="Record keepers this client is associated with"
                    items={associatedRecordKeepers.map((c) => ({
                      id: c.id!,
                      name: c.firmName,
                      website: c.website,
                      phone: c.phone,
                    }))}
                    linkPrefix="/dashboard/admin/record-keepers"
                    icon={Database}
                  />
                )}

                {associatedLife.length === 0 &&
                  associatedDisability.length === 0 &&
                  associatedLtc.length === 0 &&
                  associatedMoneyManagers.length === 0 &&
                  associatedRecordKeepers.length === 0 && (
                    <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
                      <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
                      <p className="text-sm italic">No associated vendors found.</p>
                    </Card>
                  )}
              </div>

              <div className="lg:col-span-1">
                <DocumentsTab
                  client={client}
                  category="lifeDocuments"
                  title="Life & Disability Documents"
                  types={["Life", "STD/LTD", "Other"]}
                />
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
