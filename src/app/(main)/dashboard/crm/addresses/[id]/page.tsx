import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowUpRight, Globe, Mail, MapPin, Pencil, Phone, User, Users } from "lucide-react";

import { getAddress } from "@/actions/addresses";
import { getPeople } from "@/actions/people";
import { PersonAvatar } from "@/components/crm/person-avatar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/utils";

interface AddressPageProps {
  params: {
    id: string;
  };
}

export default async function AddressPage({ params }: AddressPageProps) {
  const { id } = await params;
  const result = await getAddress(id);

  if (!result.success || !result.address) {
    notFound();
  }

  const address = result.address;

  // Fetch associated people
  const peopleResult = await getPeople();
  const people = peopleResult.success && peopleResult.people ? peopleResult.people : [];

  const associatedPeople = people.flatMap((p) => {
    const addrLink = p.addresses?.find((a) => a.id === address.id);
    if (addrLink) {
      return [
        {
          id: p.id!,
          firstName: p.firstName,
          lastName: p.lastName,
          photoUrl: p.photoUrl,
          email: p.emails?.find((e) => e.isPrimary)?.address || p.emails?.[0]?.address || "N/A",
          phone: p.phones?.find((ph) => ph.isPrimary)?.number || p.phones?.[0]?.number || "N/A",
          type: addrLink.type,
          isPrimary: addrLink.isPrimary,
        },
      ];
    }
    if (p.addressIds?.includes(address.id!)) {
      return [
        {
          id: p.id!,
          firstName: p.firstName,
          lastName: p.lastName,
          photoUrl: p.photoUrl,
          email: p.emails?.find((e) => e.isPrimary)?.address || p.emails?.[0]?.address || "N/A",
          phone: p.phones?.find((ph) => ph.isPrimary)?.number || p.phones?.[0]?.number || "N/A",
          type: "Home",
          isPrimary: false,
        },
      ];
    }
    return [];
  });

  return (
    <div className="fade-in mx-auto w-full max-w-6xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 rounded-md border-2 border-primary/10">
            <AvatarFallback className="rounded-md bg-primary/5 text-2xl text-primary">
              <MapPin className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">{address.street1}</h1>
            {address.street2 && <p className="mt-0.5 text-lg text-muted-foreground">{address.street2}</p>}
            <p className="mt-1 flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" /> {address.city}, {address.state} {address.zipCode} • {address.country}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/crm/addresses/${address.id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Address
          </Button>
        </Link>
      </div>

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
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Street Address</p>
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
                    <div key={person.id} className="group flex items-center justify-between py-4 first:pt-0 last:pb-0">
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
                            <Badge variant={person.isPrimary ? "default" : "secondary"} className="py-0 text-[10px]">
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
    </div>
  );
}
