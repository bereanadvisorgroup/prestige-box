"use client";

import * as React from "react";

import Link from "next/link";

import {
  ArrowUpRight,
  Briefcase,
  Calculator,
  Contact,
  CreditCard,
  Database,
  Fingerprint,
  Globe,
  Heart,
  HeartHandshake,
  HeartPulse,
  Home,
  Landmark,
  MapPin,
  Phone,
  ReceiptText,
  Scale,
  Shield,
  ShieldAlert,
  TrendingUp,
  User,
} from "lucide-react";

import { NotesView } from "@/components/features/notes/notes-view";
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
  InsuranceAgency,
  LawFirm,
  LifeInsuranceCompany,
  LongTermCareInsurance,
  MoneyManager,
  Person,
  PropertyAndCasualtyFirm,
  RecordKeeper,
} from "@/types/crm";
import type { NoteSummary } from "@/types/notes";

import { PersonNotesCard } from "./person-notes-card";

interface PersonProfileTabsProps {
  person: Person;
  addresses: Address[];
  associatedClient: Client | null;
  associatedLawFirms: LawFirm[];
  associatedAccountingFirms: AccountingFirm[];
  associatedInsuranceAgencies: InsuranceAgency[];
  associatedActuarialFirms: ActuarialFirm[];
  associatedBanks: Bank[];
  associatedPropertyAndCasualties: PropertyAndCasualtyFirm[];
  associatedLife: LifeInsuranceCompany[];
  associatedDisability: DisabilityInsuranceCompany[];
  associatedLtc: LongTermCareInsurance[];
  associatedMoneyManagers: MoneyManager[];
  associatedRecordKeepers: RecordKeeper[];
  notes: NoteSummary[];
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
  items: { id: string; name: string; website?: string | null; phone?: string | null; title?: string | null }[];
  linkPrefix: string;
  icon: any;
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
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{item.name}</h4>
                    {item.title && (
                      <p className="text-muted-foreground text-[11px] font-semibold mt-0.5">{item.title}</p>
                    )}
                  </div>
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

export function PersonProfileTabs({
  person,
  addresses,
  associatedClient,
  associatedLawFirms,
  associatedAccountingFirms,
  associatedInsuranceAgencies,
  associatedActuarialFirms,
  associatedBanks,
  associatedPropertyAndCasualties,
  associatedLife,
  associatedDisability,
  associatedLtc,
  associatedMoneyManagers,
  associatedRecordKeepers,
  notes,
}: PersonProfileTabsProps) {
  const [activeTab, setActiveTab] = React.useState("general");

  return (
    <div className="fade-in col-span-1 w-full animate-in duration-500">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="hide-scrollbar -mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          <TabsList className="inline-flex h-9 min-w-max items-center justify-start gap-1 rounded-lg border bg-muted/50 p-1 text-muted-foreground shadow-inner">
            <TabsTrigger
              value="general"
              className="rounded-md px-2.5 py-1 font-medium text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              General
            </TabsTrigger>
            {associatedClient && (
              <TabsTrigger
                value="client"
                className="rounded-md px-2.5 py-1 font-medium text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Client Profile
              </TabsTrigger>
            )}
            {associatedLawFirms.length > 0 && (
              <TabsTrigger
                value="law-firm"
                className="rounded-md px-2.5 py-1 font-medium text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Law Firms
              </TabsTrigger>
            )}
            {associatedAccountingFirms.length > 0 && (
              <TabsTrigger
                value="accounting-firm"
                className="rounded-md px-2.5 py-1 font-medium text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Accounting Firms
              </TabsTrigger>
            )}
            {associatedInsuranceAgencies.length > 0 && (
              <TabsTrigger
                value="insurance-agency"
                className="rounded-md px-2.5 py-1 font-medium text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Insurance Agencies
              </TabsTrigger>
            )}
            {associatedActuarialFirms.length > 0 && (
              <TabsTrigger
                value="actuarial-firm"
                className="rounded-md px-2.5 py-1 font-medium text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Actuarial Firms
              </TabsTrigger>
            )}
            {associatedBanks.length > 0 && (
              <TabsTrigger
                value="bank"
                className="rounded-md px-2.5 py-1 font-medium text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Banks
              </TabsTrigger>
            )}
            {associatedPropertyAndCasualties.length > 0 && (
              <TabsTrigger
                value="property-casualty"
                className="rounded-md px-2.5 py-1 font-medium text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Property & Casualty
              </TabsTrigger>
            )}
            {associatedLife.length > 0 && (
              <TabsTrigger
                value="life-insurance"
                className="rounded-md px-2.5 py-1 font-medium text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Life Insurance
              </TabsTrigger>
            )}
            {associatedDisability.length > 0 && (
              <TabsTrigger
                value="disability-insurance"
                className="rounded-md px-2.5 py-1 font-medium text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Disability Insurance
              </TabsTrigger>
            )}
            {associatedLtc.length > 0 && (
              <TabsTrigger
                value="long-term-care"
                className="rounded-md px-2.5 py-1 font-medium text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Long Term Care
              </TabsTrigger>
            )}
            {associatedMoneyManagers.length > 0 && (
              <TabsTrigger
                value="money-manager"
                className="rounded-md px-2.5 py-1 font-medium text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Money Managers
              </TabsTrigger>
            )}
            {associatedRecordKeepers.length > 0 && (
              <TabsTrigger
                value="record-keeper"
                className="rounded-md px-2.5 py-1 font-medium text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Record Keepers
              </TabsTrigger>
            )}
            <TabsTrigger
              value="notes"
              className="rounded-md px-2.5 py-1 font-medium text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Notes
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl bg-background/50 backdrop-blur-sm">
          {/* General Tab */}
          <TabsContent value="general" className="m-0 border-0 outline-none">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-6">
                {/* Contact Details */}
                <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
                  <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Contact className="h-5 w-5 text-primary" /> Contact Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div>
                      <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Email Addresses
                      </p>
                      {person.emails && person.emails.length > 0 ? (
                        <div className="space-y-2">
                          {person.emails.map((email) => (
                            <div key={email.id} className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{email.address}</span>
                              <Badge
                                variant={email.isPrimary ? "default" : "outline"}
                                className="px-1.5 py-0 text-[10px]"
                              >
                                {email.type} {email.isPrimary && "(Primary)"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No email addresses listed.</p>
                      )}
                    </div>

                    <div>
                      <p className="mt-4 mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Phone Numbers
                      </p>
                      {person.phones && person.phones.length > 0 ? (
                        <div className="space-y-2">
                          {person.phones.map((phone) => (
                            <div key={phone.id} className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{formatPhoneNumber(phone.number)}</span>
                              <Badge
                                variant={phone.isPrimary ? "default" : "outline"}
                                className="px-1.5 py-0 text-[10px]"
                              >
                                {phone.type} {phone.isPrimary && "(Primary)"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No phone numbers listed.</p>
                      )}
                    </div>

                    <div>
                      <p className="mt-4 mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Social Media Accounts
                      </p>
                      {person.socialMedia && person.socialMedia.length > 0 ? (
                        <div className="space-y-2">
                          {person.socialMedia.map((sm) => {
                            const Icon = Globe;

                            return (
                              <div key={sm.id} className="flex items-center gap-2 text-sm">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <a
                                  href={sm.url.startsWith("http") ? sm.url : `https://${sm.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                >
                                  {sm.type}
                                </a>
                                <Badge
                                  variant={sm.isPrimary ? "default" : "outline"}
                                  className="px-1.5 py-0 text-[10px]"
                                >
                                  {sm.isPrimary ? "Primary" : "Secondary"}
                                  {sm.useProfilePhoto && " (Using Photo)"}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No social media accounts listed.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Associated Locations */}
                <Card className="border-none shadow-md">
                  <CardHeader className="border-b bg-muted/10 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-primary" /> Associated Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {addresses.length > 0 ? (
                      <div className="space-y-4">
                        {addresses.map((address) => {
                          const personAddrInfo = person.addresses?.find((a) => a.id === address.id);
                          return (
                            <div
                              key={address.id}
                              className="group flex items-start justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/5"
                            >
                              <div className="space-y-1">
                                <p className="font-semibold text-sm">{address.street1}</p>
                                {address.street2 && <p className="text-sm">{address.street2}</p>}
                                <p className="text-muted-foreground text-xs">
                                  {address.city}, {address.state} {address.zipCode}
                                </p>
                                {personAddrInfo && (
                                  <Badge
                                    variant={personAddrInfo.isPrimary ? "default" : "secondary"}
                                    className="mt-1 py-0 text-[10px]"
                                  >
                                    {personAddrInfo.type} {personAddrInfo.isPrimary && "(Primary)"}
                                  </Badge>
                                )}
                              </div>
                              <Link href={`/dashboard/crm/addresses/${address.id}`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                >
                                  <ArrowUpRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        <MapPin className="mx-auto mb-2 h-10 w-10 opacity-20" />
                        <p className="text-sm">No addresses associated with this person.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <PersonNotesCard personId={person.id!} initialNotes={notes} onNoteClick={() => setActiveTab("notes")} />
              </div>
            </div>
          </TabsContent>

          {/* Client Tab */}
          {associatedClient && (
            <TabsContent value="client" className="m-0 border-0 outline-none">
              <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 bg-muted/10 pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-primary" /> Client Profile
                    </CardTitle>
                    <CardDescription>Details of this person's client record</CardDescription>
                  </div>
                  <Link href={`/dashboard/crm/clients/${associatedClient.id}`}>
                    <Button variant="outline" className="font-semibold shadow-sm">
                      Go to Client Page <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {associatedClient.hobbies && associatedClient.hobbies.length > 0 && (
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                        <Heart className="h-4 w-4 text-primary" /> Hobbies & Interests
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {associatedClient.hobbies.map((h, i) => (
                          <Badge key={i} variant="secondary">
                            {h}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {associatedClient.favoriteSportsTeams && associatedClient.favoriteSportsTeams.length > 0 && (
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                        <TrendingUp className="h-4 w-4 text-primary" /> Favorite Sports Teams
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {associatedClient.favoriteSportsTeams.map((t, i) => (
                          <Badge key={i} variant="default" className="font-bold">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {associatedClient.employments && associatedClient.employments.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="mb-3 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                        <Briefcase className="h-4 w-4 text-primary" /> Employment History
                      </h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {associatedClient.employments.map((emp: any, i: number) => (
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

                  {((associatedClient.mortgages && associatedClient.mortgages.length > 0) ||
                    (associatedClient.liabilities && associatedClient.liabilities.length > 0)) && (
                    <div className="grid grid-cols-1 gap-6 border-t pt-4 md:grid-cols-2">
                      {associatedClient.mortgages && associatedClient.mortgages.length > 0 && (
                        <div>
                          <h4 className="mb-3 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                            <Home className="h-4 w-4 text-primary" /> Mortgages
                          </h4>
                          <div className="space-y-2">
                            {associatedClient.mortgages.map((m: any, idx: number) => (
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
                      {associatedClient.liabilities && associatedClient.liabilities.length > 0 && (
                        <div>
                          <h4 className="mb-3 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                            <CreditCard className="h-4 w-4 text-primary" /> Liabilities
                          </h4>
                          <div className="space-y-2">
                            {associatedClient.liabilities.map((l: any, idx: number) => (
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
            </TabsContent>
          )}

          {/* Law Firm Tab */}
          {associatedLawFirms.length > 0 && (
            <TabsContent value="law-firm" className="m-0 border-0 outline-none">
              <AssociationCardList
                title="Associated Law Firms"
                description="Law firms this person is associated with"
                items={associatedLawFirms.map((f) => ({
                  id: f.id!,
                  name: f.firmName,
                  website: f.website,
                  phone: f.phone,
                  title: (f.personTitles as Record<string, string>)?.[person.id as string] || "Legal Professional",
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
                description="Accounting firms this person is associated with"
                items={associatedAccountingFirms.map((f) => ({
                  id: f.id!,
                  name: f.firmName,
                  website: f.website,
                  phone: f.phone,
                  title: (f.personTitles as Record<string, string>)?.[person.id as string] || "Accounting Professional",
                }))}
                linkPrefix="/dashboard/crm/accounting-firms"
                icon={ReceiptText}
              />
            </TabsContent>
          )}

          {/* Insurance Agency Tab */}
          {associatedInsuranceAgencies.length > 0 && (
            <TabsContent value="insurance-agency" className="m-0 border-0 outline-none">
              <AssociationCardList
                title="Associated Insurance Agencies"
                description="Insurance agencies this person is associated with"
                items={associatedInsuranceAgencies.map((f) => ({
                  id: f.id!,
                  name: f.firmName,
                  website: f.website,
                  phone: f.phone,
                  title: (f.personTitles as Record<string, string>)?.[person.id as string] || "Insurance Professional",
                }))}
                linkPrefix="/dashboard/crm/insurance-agencies"
                icon={Shield}
              />
            </TabsContent>
          )}

          {/* Actuarial Firm Tab */}
          {associatedActuarialFirms.length > 0 && (
            <TabsContent value="actuarial-firm" className="m-0 border-0 outline-none">
              <AssociationCardList
                title="Associated Actuarial Firms"
                description="Actuarial firms this person is associated with"
                items={associatedActuarialFirms.map((f) => ({
                  id: f.id!,
                  name: f.firmName,
                  website: f.website,
                  phone: f.phone,
                  title: (f.personTitles as Record<string, string>)?.[person.id as string] || "Actuarial Professional",
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
                description="Banks this person is associated with"
                items={associatedBanks.map((f) => ({
                  id: f.id!,
                  name: f.firmName,
                  website: f.website,
                  phone: f.phone,
                  title: (f.personTitles as Record<string, string>)?.[person.id as string] || "Banking Professional",
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
                description="Property and Casualty firms this person is associated with"
                items={associatedPropertyAndCasualties.map((f) => ({
                  id: f.id!,
                  name: f.firmName,
                  website: f.website,
                  phone: f.phone,
                  title: (f.personTitles as Record<string, string>)?.[person.id as string] || "Insurance Professional",
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
                description="Life insurance companies this person is associated with"
                items={associatedLife.map((c) => ({
                  id: c.id!,
                  name: c.name,
                  website: c.websiteUrl,
                  phone: c.phone,
                  title: (c.personTitles as Record<string, string>)?.[person.id as string] || "Insurance Professional",
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
                description="Disability insurance companies this person is associated with"
                items={associatedDisability.map((c) => ({
                  id: c.id!,
                  name: c.name,
                  website: c.websiteUrl,
                  phone: c.phone,
                  title: (c.personTitles as Record<string, string>)?.[person.id as string] || "Insurance Professional",
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
                description="Long term care insurance companies this person is associated with"
                items={associatedLtc.map((c) => ({
                  id: c.id!,
                  name: c.name,
                  website: c.websiteUrl,
                  phone: c.phone,
                  title: (c.personTitles as Record<string, string>)?.[person.id as string] || "Insurance Professional",
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
                description="Money managers this person is associated with"
                items={associatedMoneyManagers.map((c) => ({
                  id: c.id!,
                  name: c.firmName,
                  website: c.website,
                  phone: c.phone,
                  title: (c.personTitles as Record<string, string>)?.[person.id as string] || "Wealth Advisor",
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
                description="Record keepers this person is associated with"
                items={associatedRecordKeepers.map((c) => ({
                  id: c.id!,
                  name: c.firmName,
                  website: c.website,
                  phone: c.phone,
                  title: (c.personTitles as Record<string, string>)?.[person.id as string] || "Plan Administrator",
                }))}
                linkPrefix="/dashboard/admin/record-keepers"
                icon={Database}
              />
            </TabsContent>
          )}

          {/* Notes Tab */}
          <TabsContent value="notes" className="m-0 border-0 outline-none">
            <div className="p-6">
              <NotesView
                scope={{ personId: person.id }}
                title="Notes"
                defaultAssociations={[{ entityType: "person", entityId: person.id! }]}
                lockAssociations
                useHeaderPortal={false}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
