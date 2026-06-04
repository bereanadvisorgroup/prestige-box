import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowUpRight, Globe, Mail, MapPin, Pencil, Phone, User, Users } from "lucide-react";

import { getAddress } from "@/actions/addresses";
import { getPeople } from "@/actions/people";
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
    <div className="w-full max-w-6xl mx-auto py-8 px-4 md:px-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10 rounded-md">
            <AvatarFallback className="text-2xl bg-primary/5 text-primary rounded-md">
              <MapPin className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{address.street1}</h1>
            {address.street2 && <p className="text-lg text-muted-foreground mt-0.5">{address.street2}</p>}
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Address card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-md bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Address details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm font-semibold">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Street Address</p>
                <p className="mt-1">{address.street1}</p>
                {address.street2 && <p className="mt-0.5">{address.street2}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">City</p>
                  <p className="mt-1">{address.city}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">State</p>
                  <p className="mt-1">{address.state}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Zip Code</p>
                  <p className="mt-1 font-mono">{address.zipCode}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Country</p>
                  <p className="mt-1">{address.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Associated People card */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Associated People ({associatedPeople.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {associatedPeople.length > 0 ? (
                <div className="divide-y">
                  {associatedPeople.map((person) => (
                    <div key={person.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {person.firstName} {person.lastName}
                          </span>
                          <Badge variant={person.isPrimary ? "default" : "secondary"} className="text-[10px] py-0">
                            {person.type} {person.isPrimary && "(Primary)"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-4">
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
                <div className="text-center p-8 text-muted-foreground">
                  <User className="h-10 w-10 mx-auto opacity-20 mb-2" />
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
