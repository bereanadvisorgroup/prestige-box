import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowUpRight, Home, Mail, MapPin, Pencil, Phone, User, Users } from "lucide-react";

import { getHousehold } from "@/actions/households";
import { PersonAvatar } from "@/components/crm/person-avatar";
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
    <div className="fade-in mx-auto w-full max-w-6xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 rounded-md border-2 border-primary/10">
            <AvatarFallback className="rounded-md bg-primary/5 text-2xl text-primary">
              <Home className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">{household.name}</h1>
            <p className="mt-1 flex items-center gap-2 text-muted-foreground">
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
                    <p className="mt-1 font-semibold text-sm">{address.street1}</p>
                    {address.street2 && <p className="mt-0.5 font-semibold text-sm">{address.street2}</p>}
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      City, State Zip
                    </p>
                    <p className="mt-1 font-semibold text-sm">
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Country</p>
                    <p className="mt-1 font-semibold text-sm">{address.country}</p>
                  </div>
                  <div className="border-t pt-4">
                    <Link href={`/dashboard/crm/addresses/${address.id}`}>
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
                <Users className="h-5 w-5 text-primary" /> Household Members
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {members.length > 0 ? (
                <div className="divide-y">
                  {members.map(({ person, role }) => {
                    if (!person) return null;
                    const email = person.emails?.find((e) => e.isPrimary)?.address || person.emails?.[0]?.address || "";
                    const phone = person.phones?.find((p) => p.isPrimary)?.number || person.phones?.[0]?.number || "";

                    return (
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
                                variant={role === "home_owner" ? "default" : "secondary"}
                                className="py-0 text-[10px] capitalize"
                              >
                                {role?.replace("_", " ")}
                              </Badge>
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
