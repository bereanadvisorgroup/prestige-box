"use client";

import Link from "next/link";

import {
  ArrowUpRight,
  Briefcase,
  Calculator,
  CreditCard,
  Database,
  Globe,
  Heart,
  HeartHandshake,
  HeartPulse,
  Home,
  Landmark,
  type LucideIcon,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  Scale,
  Shield,
  ShieldAlert,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

import { PersonAvatar } from "@/components/crm/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPhoneNumber } from "@/lib/utils";
import type {
  AccountingFirm,
  ActuarialFirm,
  Address,
  Bank,
  Client,
  DisabilityInsuranceCompany,
  LawFirm,
  LifeInsuranceCompany,
  LongTermCareInsurance,
  MoneyManager,
  PropertyAndCasualtyFirm,
  RecordKeeper,
} from "@/types/crm";

interface AddressProfileTabsProps {
  address: Address;
  associatedPeople: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null | undefined;
    email: string;
    phone: string;
    type: string;
    isPrimary: boolean;
  }[];
  associatedClients: { personName: string; client: Client }[];
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
  icon: LucideIcon;
}) {
  return (
    <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
      <CardHeader className="bg-muted/10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground text-sm">{item.name}</h4>
                  <Link href={`${linkPrefix}/${item.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                {item.website && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Globe className="h-3.5 w-3.5" />
                    <a
                      href={item.website.startsWith("http") ? item.website : `https://${item.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {item.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                {item.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
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

export function AddressProfileTabs({
  address,
  associatedPeople,
  associatedClients,
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
}: AddressProfileTabsProps) {
  return (
    <div className="fade-in col-span-1 w-full animate-in duration-500">
      <Tabs defaultValue="general" className="w-full">
        <div className="hide-scrollbar -mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          <TabsList className="inline-flex h-12 min-w-max items-center justify-start rounded-lg border bg-muted/50 p-1.5 text-muted-foreground shadow-inner">
            <TabsTrigger
              value="general"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              General
            </TabsTrigger>
            {associatedClients.length > 0 && (
              <TabsTrigger
                value="client"
                className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Clients
              </TabsTrigger>
            )}
            {associatedLawFirms.length > 0 && (
              <TabsTrigger
                value="law-firm"
                className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Law Firms
              </TabsTrigger>
            )}
            {associatedAccountingFirms.length > 0 && (
              <TabsTrigger
                value="accounting-firm"
                className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Accounting Firms
              </TabsTrigger>
            )}
            {associatedActuarialFirms.length > 0 && (
              <TabsTrigger
                value="actuarial-firm"
                className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Actuarial Firms
              </TabsTrigger>
            )}
            {associatedBanks.length > 0 && (
              <TabsTrigger
                value="bank"
                className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Banks
              </TabsTrigger>
            )}
            {associatedPropertyAndCasualties.length > 0 && (
              <TabsTrigger
                value="property-casualty"
                className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Property & Casualty
              </TabsTrigger>
            )}
            {associatedLife.length > 0 && (
              <TabsTrigger
                value="life-insurance"
                className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Life Insurance
              </TabsTrigger>
            )}
            {associatedDisability.length > 0 && (
              <TabsTrigger
                value="disability-insurance"
                className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Disability Insurance
              </TabsTrigger>
            )}
            {associatedLtc.length > 0 && (
              <TabsTrigger
                value="long-term-care"
                className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Long Term Care
              </TabsTrigger>
            )}
            {associatedMoneyManagers.length > 0 && (
              <TabsTrigger
                value="money-manager"
                className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Money Managers
              </TabsTrigger>
            )}
            {associatedRecordKeepers.length > 0 && (
              <TabsTrigger
                value="record-keeper"
                className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Record Keepers
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl bg-background/50 backdrop-blur-sm">
          {/* General Tab */}
          <TabsContent value="general" className="m-0 border-0 outline-none">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Address card */}
              <div className="space-y-6 md:col-span-1">
                <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
                  <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-primary" /> Address details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6 font-semibold text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        Street Address
                      </p>
                      <p className="mt-1">{address.street1}</p>
                      {address.street2 && <p className="mt-0.5">{address.street2}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">City</p>
                        <p className="mt-1">{address.city}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">State</p>
                        <p className="mt-1">{address.state}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Zip Code</p>
                        <p className="mt-1 font-mono">{address.zipCode}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Country</p>
                        <p className="mt-1">{address.country}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Associated People card */}
              <div className="space-y-6 md:col-span-2">
                <Card className="border-none shadow-md">
                  <CardHeader className="border-b bg-muted/10 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5 text-primary" /> Associated People ({associatedPeople.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {associatedPeople.length > 0 ? (
                      <div className="divide-y">
                        {associatedPeople.map((person) => (
                          <div
                            key={person.id}
                            className="group flex items-center justify-between py-4 first:pt-0 last:pb-0"
                          >
                            <div className="flex items-center gap-3">
                              <PersonAvatar
                                photoUrl={person.photoUrl}
                                firstName={person.firstName}
                                lastName={person.lastName}
                                size="sm"
                              />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">
                                    {person.firstName} {person.lastName}
                                  </span>
                                  <Badge
                                    variant={person.isPrimary ? "default" : "secondary"}
                                    className="py-0 text-[10px]"
                                  >
                                    {person.type} {person.isPrimary && "(Primary)"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-muted-foreground text-xs">
                                  {person.email && person.email !== "N/A" && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" /> {person.email}
                                    </span>
                                  )}
                                  {person.phone && person.phone !== "N/A" && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" /> {formatPhoneNumber(person.phone)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Link href={`/dashboard/crm/people/${person.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        <User className="mx-auto mb-2 h-10 w-10 opacity-20" />
                        <p className="text-sm">No people associated with this address yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Client Tab */}
          {associatedClients.length > 0 && (
            <TabsContent value="client" className="m-0 space-y-6 border-0 outline-none">
              {associatedClients.map(({ personName, client }) => (
                <Card key={client.id} className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
                  <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 bg-muted/10 pb-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-primary" /> Client Profile: {personName}
                      </CardTitle>
                      <CardDescription>Details of this person's client record</CardDescription>
                    </div>
                    <Link href={`/dashboard/crm/clients/${client.id}`}>
                      <Button variant="outline" className="font-semibold shadow-sm">
                        Go to Client Page <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {client.hobbies && client.hobbies.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                          <Heart className="h-4 w-4 text-primary" /> Hobbies & Interests
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {client.hobbies.map((h, i) => (
                            <Badge key={i} variant="secondary">
                              {h}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {client.favoriteSportsTeams && client.favoriteSportsTeams.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                          <TrendingUp className="h-4 w-4 text-primary" /> Favorite Sports Teams
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {client.favoriteSportsTeams.map((t, i) => (
                            <Badge key={i} variant="default" className="font-bold">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {client.employments && client.employments.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="mb-3 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                          <Briefcase className="h-4 w-4 text-primary" /> Employment History
                        </h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {client.employments.map((emp, i) => (
                            <div key={i} className="rounded-lg border bg-card p-4 text-sm shadow-sm">
                              <p className="font-bold">{emp.occupation}</p>
                              <p className="mt-0.5 text-muted-foreground text-xs">{emp.employerName}</p>
                              {(emp.startDate || emp.endDate) && (
                                <p className="mt-2 text-[10px] text-muted-foreground">
                                  {emp.startDate || "Present"} - {emp.endDate || "Present"}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {((client.mortgages && client.mortgages.length > 0) ||
                      (client.liabilities && client.liabilities.length > 0)) && (
                      <div className="grid grid-cols-1 gap-6 border-t pt-4 md:grid-cols-2">
                        {client.mortgages && client.mortgages.length > 0 && (
                          <div>
                            <h4 className="mb-3 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                              <Home className="h-4 w-4 text-primary" /> Mortgages
                            </h4>
                            <div className="space-y-2">
                              {client.mortgages.map((m, idx) => (
                                <div key={idx} className="space-y-1 rounded-lg border bg-card p-3 text-xs shadow-sm">
                                  {m.purchasePrice && (
                                    <p className="font-medium">
                                      Purchase Price:{" "}
                                      <span className="font-bold">${m.purchasePrice.toLocaleString()}</span>
                                    </p>
                                  )}
                                  {m.currentMarketValue && (
                                    <p className="font-medium text-muted-foreground">
                                      Current Market Value:{" "}
                                      <span className="font-bold">${m.currentMarketValue.toLocaleString()}</span>
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {client.liabilities && client.liabilities.length > 0 && (
                          <div>
                            <h4 className="mb-3 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                              <CreditCard className="h-4 w-4 text-primary" /> Liabilities
                            </h4>
                            <div className="space-y-2">
                              {client.liabilities.map((l, idx) => (
                                <div key={idx} className="space-y-1 rounded-lg border bg-card p-3 text-xs shadow-sm">
                                  <p className="font-bold">
                                    {associatedBanks?.find((b) => b.id === l.bankId)?.firmName || "Unknown Bank"}
                                  </p>
                                  <p className="font-semibold text-muted-foreground">
                                    Type: <span className="text-foreground">{l.loanType}</span>
                                  </p>
                                  <p className="text-muted-foreground">
                                    Balance:{" "}
                                    <span className="font-bold font-mono text-foreground">
                                      ${l.currentBalance.toLocaleString()}
                                    </span>
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}

          {/* Law Firm Tab */}
          {associatedLawFirms.length > 0 && (
            <TabsContent value="law-firm" className="m-0 border-0 outline-none">
              <AssociationCardList
                title="Associated Law Firms"
                description="Law firms associated with people at this address"
                items={associatedLawFirms.map((f) => ({
                  id: f.id!,
                  name: f.firmName,
                  website: f.website,
                  phone: f.phone,
                }))}
                linkPrefix="/dashboard/crm/law-firms"
                icon={Scale}
              />
            </TabsContent>
          )}

          {/* Accounting Firm Tab */}
          {associatedAccountingFirms.length > 0 && (
            <TabsContent value="accounting-firm" className="m-0 border-0 outline-none">
              <AssociationCardList
                title="Associated Accounting Firms"
                description="Accounting firms associated with people at this address"
                items={associatedAccountingFirms.map((f) => ({
                  id: f.id!,
                  name: f.firmName,
                  website: f.website,
                  phone: f.phone,
                }))}
                linkPrefix="/dashboard/crm/accounting-firms"
                icon={ReceiptText}
              />
            </TabsContent>
          )}

          {/* Actuarial Firm Tab */}
          {associatedActuarialFirms.length > 0 && (
            <TabsContent value="actuarial-firm" className="m-0 border-0 outline-none">
              <AssociationCardList
                title="Associated Actuarial Firms"
                description="Actuarial firms associated with people at this address"
                items={associatedActuarialFirms.map((f) => ({
                  id: f.id!,
                  name: f.firmName,
                  website: f.website,
                  phone: f.phone,
                }))}
                linkPrefix="/dashboard/crm/actuarial-firms"
                icon={Calculator}
              />
            </TabsContent>
          )}

          {/* Bank Tab */}
          {associatedBanks.length > 0 && (
            <TabsContent value="bank" className="m-0 border-0 outline-none">
              <AssociationCardList
                title="Associated Banks"
                description="Banks associated with people at this address"
                items={associatedBanks.map((f) => ({
                  id: f.id!,
                  name: f.firmName,
                  website: f.website,
                  phone: f.phone,
                }))}
                linkPrefix="/dashboard/crm/banks"
                icon={Landmark}
              />
            </TabsContent>
          )}

          {/* Property & Casualty Tab */}
          {associatedPropertyAndCasualties.length > 0 && (
            <TabsContent value="property-casualty" className="m-0 border-0 outline-none">
              <AssociationCardList
                title="Associated Property & Casualty Firms"
                description="Property and Casualty firms associated with people at this address"
                items={associatedPropertyAndCasualties.map((f) => ({
                  id: f.id!,
                  name: f.firmName,
                  website: f.website,
                  phone: f.phone,
                }))}
                linkPrefix="/dashboard/crm/property-and-casualty"
                icon={Shield}
              />
            </TabsContent>
          )}

          {/* Life Insurance Tab */}
          {associatedLife.length > 0 && (
            <TabsContent value="life-insurance" className="m-0 border-0 outline-none">
              <AssociationCardList
                title="Associated Life Insurance Companies"
                description="Life insurance companies associated with people at this address"
                items={associatedLife.map((c) => ({
                  id: c.id!,
                  name: c.name,
                  website: c.websiteUrl,
                  phone: c.phone,
                }))}
                linkPrefix="/dashboard/admin/life-insurance-companies"
                icon={HeartHandshake}
              />
            </TabsContent>
          )}

          {/* Disability Insurance Tab */}
          {associatedDisability.length > 0 && (
            <TabsContent value="disability-insurance" className="m-0 border-0 outline-none">
              <AssociationCardList
                title="Associated Disability Insurance Companies"
                description="Disability insurance companies associated with people at this address"
                items={associatedDisability.map((c) => ({
                  id: c.id!,
                  name: c.name,
                  website: c.websiteUrl,
                  phone: c.phone,
                }))}
                linkPrefix="/dashboard/admin/disability-insurance-companies"
                icon={ShieldAlert}
              />
            </TabsContent>
          )}

          {/* Long Term Care Tab */}
          {associatedLtc.length > 0 && (
            <TabsContent value="long-term-care" className="m-0 border-0 outline-none">
              <AssociationCardList
                title="Associated Long Term Care Insurance"
                description="Long term care insurance companies associated with people at this address"
                items={associatedLtc.map((c) => ({
                  id: c.id!,
                  name: c.name,
                  website: c.websiteUrl,
                  phone: c.phone,
                }))}
                linkPrefix="/dashboard/admin/long-term-care-insurance"
                icon={HeartPulse}
              />
            </TabsContent>
          )}

          {/* Money Manager Tab */}
          {associatedMoneyManagers.length > 0 && (
            <TabsContent value="money-manager" className="m-0 border-0 outline-none">
              <AssociationCardList
                title="Associated Money Managers"
                description="Money managers associated with people at this address"
                items={associatedMoneyManagers.map((c) => ({
                  id: c.id!,
                  name: c.firmName,
                  website: c.website,
                  phone: c.phone,
                }))}
                linkPrefix="/dashboard/admin/money-managers"
                icon={TrendingUp}
              />
            </TabsContent>
          )}

          {/* Record Keeper Tab */}
          {associatedRecordKeepers.length > 0 && (
            <TabsContent value="record-keeper" className="m-0 border-0 outline-none">
              <AssociationCardList
                title="Associated Record Keepers"
                description="Record keepers associated with people at this address"
                items={associatedRecordKeepers.map((c) => ({
                  id: c.id!,
                  name: c.firmName,
                  website: c.website,
                  phone: c.phone,
                }))}
                linkPrefix="/dashboard/admin/record-keepers"
                icon={Database}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
