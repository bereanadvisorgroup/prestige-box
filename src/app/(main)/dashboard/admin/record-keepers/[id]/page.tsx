import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowUpRight, Briefcase, Building2, Edit, Globe, Mail, MapPin, Phone, Users } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getRecordKeeper } from "@/actions/record-keepers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPhoneNumber } from "@/lib/utils";
import type { Address, Company, Person } from "@/types/crm";

interface RecordKeeperDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecordKeeperDetailsPage({ params }: RecordKeeperDetailsPageProps) {
  const { id } = await params;
  const result = await getRecordKeeper(id);

  if (!result.success || !result.recordKeeper) {
    notFound();
  }

  const { recordKeeper, people: peopleRaw, address: addressRaw } = result;
  const people = (peopleRaw || []) as Person[];
  const address = addressRaw as Address | null;

  // Fetch associated clients details
  const clientsResult = await getClients();
  const allClients = clientsResult.success && clientsResult.clients ? clientsResult.clients : [];
  const associatedClients = allClients.filter((c) => (recordKeeper.clientIds || []).includes(c.id!));

  // Fetch associated companies details
  const companiesResult = await getCompanies();
  const allCompanies = companiesResult.success && companiesResult.companies ? companiesResult.companies : [];
  const associatedCompanies = allCompanies.filter((c) => (recordKeeper.companyIds || []).includes(c.id!));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10 rounded-md">
            <AvatarFallback className="bg-primary/5 text-primary flex items-center justify-center h-full w-full rounded-md">
              <Building2 className="h-8 w-8 text-primary" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">{recordKeeper.firmName}</h1>
            <p className="mt-1 flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              {people.length} Associated Record Keeping Professional{people.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="font-semibold shadow-sm">
          <Link href={`/dashboard/admin/record-keepers/${recordKeeper.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Record Keeper
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="h-fit md:col-span-1 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Associated Professionals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {people.length > 0 ? (
              <div className="space-y-4">
                {people.map((person, index) => {
                  const email = person.emails?.find((e) => e.isPrimary)?.address || person.emails?.[0]?.address;
                  const phone = person.phones?.find((p) => p.isPrimary)?.number || person.phones?.[0]?.number;
                  return (
                    <div key={person.id} className="space-y-3">
                      {index > 0 && <Separator className="my-3" />}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-muted">
                          {person.photoUrl && (
                            <AvatarImage
                              src={person.photoUrl}
                              alt={`${person.firstName} ${person.lastName}`}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="bg-primary/5 text-xs text-primary font-bold">
                            {person.firstName?.[0] || ""}
                            {person.lastName?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link
                            href={`/dashboard/crm/people/${person.id}`}
                            className="font-semibold text-sm hover:underline text-primary flex items-center gap-0.5"
                          >
                            {person.firstName} {person.lastName}
                            <ArrowUpRight className="h-3 w-3 opacity-60" />
                          </Link>
                          <p className="text-muted-foreground text-xs font-medium">Plan Administrator</p>
                        </div>
                      </div>

                      <div className="pl-13 space-y-1 text-xs">
                        {email && (
                          <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <a href={`mailto:${email}`}>{email}</a>
                          </div>
                        )}
                        {phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{formatPhoneNumber(phone)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No associated professionals.</p>
            )}

            <Separator />

            <div className="flex items-start gap-3 pt-2">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium text-sm leading-none">Firm Address</p>
                {address ? (
                  <div className="text-muted-foreground text-sm">
                    <p>{address.street1}</p>
                    {address.street2 && <p>{address.street2}</p>}
                    <p>
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No address provided</p>
                )}
              </div>
            </div>

            {recordKeeper.website && (
              <>
                <Separator />
                <div className="flex items-start gap-3 pt-2">
                  <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="font-medium text-sm leading-none">Website</p>
                    <a
                      href={
                        recordKeeper.website.startsWith("http")
                          ? recordKeeper.website
                          : `https://${recordKeeper.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                    >
                      {recordKeeper.website.replace(/^https?:\/\//, "")}
                      <ArrowUpRight className="h-3 w-3 opacity-60" />
                    </a>
                  </div>
                </div>
              </>
            )}

            {recordKeeper.phone && (
              <>
                <Separator />
                <div className="flex items-start gap-3 pt-2">
                  <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="font-medium text-sm leading-none">Phone Number</p>
                    <a href={`tel:${recordKeeper.phone}`} className="text-primary text-sm hover:underline">
                      {formatPhoneNumber(recordKeeper.phone)}
                    </a>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Associated Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              {associatedClients.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {associatedClients.map((client) => {
                    const clientPerson = client.person as Person | null;
                    const clientName = clientPerson
                      ? `${clientPerson.firstName} ${clientPerson.lastName}`
                      : "Unknown Client";
                    const clientEmail =
                      clientPerson?.emails?.find((e) => e.isPrimary)?.address ||
                      clientPerson?.emails?.[0]?.address ||
                      "";
                    const clientPhone =
                      clientPerson?.phones?.find((p) => p.isPrimary)?.number || clientPerson?.phones?.[0]?.number || "";

                    return (
                      <Link
                        key={client.id}
                        href={`/dashboard/crm/clients/${client.id}`}
                        className="group flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-sm transition-colors group-hover:text-primary">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            {clientName}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {clientEmail && <span className="mr-3">{clientEmail}</span>}
                            {clientPhone && <span>{formatPhoneNumber(clientPhone)}</span>}
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/20 py-10 text-center text-muted-foreground">
                  <p>No associated clients found.</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href={`/dashboard/admin/record-keepers/${recordKeeper.id}/edit`}>Link Clients</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Associated Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {associatedCompanies.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {associatedCompanies.map((company) => {
                    const companyName = company.name;
                    const companyPhone = company.phone || "";
                    const companyWebsite = company.website || "";

                    return (
                      <Link
                        key={company.id}
                        href={`/dashboard/crm/companies/${company.id}`}
                        className="group flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-sm transition-colors group-hover:text-primary">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {companyName}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {companyWebsite && (
                              <span className="mr-3">{companyWebsite.replace(/^https?:\/\//, "")}</span>
                            )}
                            {companyPhone && <span>{formatPhoneNumber(companyPhone)}</span>}
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/20 py-10 text-center text-muted-foreground">
                  <p>No associated companies found.</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href={`/dashboard/admin/record-keepers/${recordKeeper.id}/edit`}>Link Companies</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
