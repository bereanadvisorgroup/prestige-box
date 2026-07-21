import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowUpRight, Mail, MapPin, Pencil, Phone, User, Users } from "lucide-react";

import { getAssets } from "@/actions/assets";
import { getClients } from "@/actions/clients";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { PersonAvatar } from "@/components/crm/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type AnyFinancialItem } from "@/lib/financial-rollup";
import { calculatePortfolioRollups } from "@/lib/portfolio-rollup";
import { formatPhoneNumber } from "@/lib/utils";
import type { Address } from "@/types/crm";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";
import { HouseholdNetWorthChart } from "../_components/household-net-worth-chart";

interface HouseholdOverviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HouseholdOverviewPage({ params }: HouseholdOverviewPageProps) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { household, address, members, clientIds } = activeRes;
  const allClientsRes = await getClients();
  const allClients = allClientsRes.success ? allClientsRes.clients || [] : [];
  const activeClients = allClients.filter((c) => clientIds.includes(c.id || ""));

  // Load client assets for active rollup clients
  const clientAssetsMap: Record<string, AnyFinancialItem[]> = {};
  await Promise.all(
    activeClients.map(async (client) => {
      if (!client.id) return;
      const res = await getAssets(client.id);
      if (res.success && res.assets) {
        clientAssetsMap[client.id] = res.assets as AnyFinancialItem[];
      }
    }),
  );

  const portfolioOverviewData = calculatePortfolioRollups(household, members, activeClients, clientAssetsMap);

  return (
    <div className="space-y-6 py-4">
      <HouseholdHeaderPortal sectionName="Overview">
        <Link href={`/dashboard/crm/households/${household.id}/edit`}>
          <Button size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Household
          </Button>
        </Link>
      </HouseholdHeaderPortal>

      {/* Household Net Worth Graph */}
      <HouseholdNetWorthChart data={portfolioOverviewData} householdName={household.name} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Address Detail Card */}
        <div className="space-y-6 md:col-span-1">
          <Card className="h-full border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" /> Primary Address
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {address ? (
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      Street Address
                    </p>
                    <p className="mt-1 font-semibold text-sm">{(address as Address).street1}</p>
                    {(address as Address).street2 && (
                      <p className="mt-0.5 font-semibold text-sm">{(address as Address).street2}</p>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      City, State Zip
                    </p>
                    <p className="mt-1 font-semibold text-sm">
                      {(address as Address).city}, {(address as Address).state} {(address as Address).zipCode}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Country</p>
                    <p className="mt-1 font-semibold text-sm">{(address as Address).country}</p>
                  </div>
                  <div className="border-t pt-4">
                    <Link href={`/dashboard/crm/addresses/${(address as Address).id}`}>
                      <Button variant="outline" className="flex w-full items-center justify-center gap-2 text-xs">
                        View Full Location Details
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  <MapPin className="mx-auto mb-2 h-8 w-8 opacity-20" />
                  <p>No address linked to this household.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Members List Card */}
        <div className="space-y-6 md:col-span-2">
          <Card className="h-full border-none shadow-md">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" /> Household Members & Rollup Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {members.length > 0 ? (
                <div className="divide-y">
                  {members.map(({ person, role, clientId, includeInFinancialRollup }) => {
                    if (!person) return null;
                    const email = person.emails?.find((e) => e.isPrimary)?.address || person.emails?.[0]?.address || "";
                    const phone = person.phones?.find((p) => p.isPrimary)?.number || person.phones?.[0]?.number || "";

                    return (
                      <div
                        key={person.id || clientId}
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
                                variant={role === "home_owner" ? "default" : "secondary"}
                                className="py-0 text-[10px] capitalize"
                              >
                                {role?.replace("_", " ")}
                              </Badge>
                              {includeInFinancialRollup ? (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-500/30 bg-emerald-50 py-0 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                >
                                  Rollup Active
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-muted bg-muted/30 py-0 text-[10px] text-muted-foreground"
                                >
                                  Rollup Excluded
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-muted-foreground text-xs">
                              {email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" /> {email}
                                </span>
                              )}
                              {phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {formatPhoneNumber(phone)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Link href={`/dashboard/crm/clients/${clientId}`}>
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
                  <User className="mx-auto mb-2 h-10 w-10 opacity-20" />
                  <p className="text-sm">No members in this household yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
