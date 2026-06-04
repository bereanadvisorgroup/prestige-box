import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowUpRight, Home, Mail, MapPin, Pencil, Phone, User, Users } from "lucide-react";

import { getHousehold } from "@/actions/households";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/utils";
import type { Address, Person } from "@/types/crm";

interface HouseholdPageProps {
  params: {
    id: string;
  };
}

export default async function HouseholdPage({ params }: HouseholdPageProps) {
  const { id } = await params;
  const result = await getHousehold(id);

  if (!result.success || !result.household) {
    notFound();
  }

  const household = result.household;
  const address = result.address as Address | null;
  const members = (result.members || []).map((m) => ({
    person: m.person as Person | null,
    role: m.role,
  }));

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 md:px-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10 rounded-md">
            <AvatarFallback className="text-2xl bg-primary/5 text-primary rounded-md">
              <Home className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{household.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Users className="h-4 w-4" /> {members.length} {members.length === 1 ? "Member" : "Members"}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/crm/households/${household.id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Household
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Address Detail Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-md bg-gradient-to-b from-card to-muted/20 h-full">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Primary Address
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {address ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Street Address
                    </p>
                    <p className="mt-1 text-sm font-semibold">{address.street1}</p>
                    {address.street2 && <p className="mt-0.5 text-sm font-semibold">{address.street2}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      City, State Zip
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</p>
                    <p className="mt-1 text-sm font-semibold">{address.country}</p>
                  </div>
                  <div className="border-t pt-4">
                    <Link href={`/dashboard/crm/addresses/${address.id}`}>
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2 text-xs">
                        View Full Location Details
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <MapPin className="h-8 w-8 mx-auto opacity-20 mb-2" />
                  <p>No address linked to this household.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Members List Card */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-md h-full">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Household Members
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {members.length > 0 ? (
                <div className="divide-y">
                  {members.map(({ person, role }) => {
                    if (!person) return null;
                    const email =
                      person.emails?.find((e: any) => e.isPrimary)?.address || person.emails?.[0]?.address || "";
                    const phone =
                      person.phones?.find((p: any) => p.isPrimary)?.number || person.phones?.[0]?.number || "";

                    return (
                      <div
                        key={person.id}
                        className="py-4 first:pt-0 last:pb-0 flex items-center justify-between group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {person.firstName} {person.lastName}
                            </span>
                            <Badge
                              variant={role === "home_owner" ? "default" : "secondary"}
                              className="text-[10px] py-0 capitalize"
                            >
                              {role?.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-4">
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
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <User className="h-10 w-10 mx-auto opacity-20 mb-2" />
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
