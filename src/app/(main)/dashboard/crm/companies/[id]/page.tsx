import Link from "next/link";
import { notFound } from "next/navigation";

import { Briefcase, Building2, ExternalLink, Fingerprint, MapPin, Pencil, Phone, Users } from "lucide-react";

import { getAddress } from "@/actions/addresses";
import { getClients } from "@/actions/clients";
import { getCompany } from "@/actions/companies";
import { PersonAvatar } from "@/components/crm/person-avatar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/utils";

interface CompanyPageProps {
  params: {
    id: string;
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { id } = await params;
  const result = await getCompany(id);

  if (!result.success || !result.company) {
    notFound();
  }

  const company = result.company;
  const addressResult = company.addressId ? await getAddress(company.addressId) : null;
  const address = addressResult?.success ? addressResult.address : null;

  const allClientsResult = await getClients();
  const associatedClients = (
    allClientsResult.success && allClientsResult.clients ? allClientsResult.clients : []
  ).filter((c) => (company.clientIds || []).includes(c.id!));

  return (
    <div className="fade-in mx-auto w-full max-w-7xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 rounded-md border-2 border-primary/10">
            <AvatarFallback className="rounded-md bg-primary/5 text-2xl text-primary">
              <Building2 className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">{company.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/crm/companies/${id}/edit`}>
            <Button>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Company
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="overflow-hidden border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">Contact & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {company.dba && (
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                      Doing Business As
                    </p>
                    <p className="mt-1 font-semibold text-sm">{company.dba}</p>
                  </div>
                </div>
              )}
              {company.ein && (
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Fingerprint className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                      Federal Tax ID (EIN)
                    </p>
                    <p className="mt-1 font-mono font-semibold text-sm">{company.ein}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <GlobeIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Website</p>
                  {company.website ? (
                    <a
                      href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 font-semibold text-blue-600 text-sm hover:underline"
                    >
                      {company.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="mt-1 font-semibold text-sm">N/A</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Phone</p>
                  <p className="mt-1 font-semibold text-sm">{formatPhoneNumber(company.phone) || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Address</p>
                  {address ? (
                    <div className="mt-1 font-semibold text-sm">
                      <p>{address.street1}</p>
                      {address.street2 && <p>{address.street2}</p>}
                      <p>
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <p className="mt-0.5 text-muted-foreground text-xs">{address.country}</p>
                    </div>
                  ) : (
                    <p className="mt-1 font-semibold text-sm">N/A</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" /> Situs Records
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(company.situsRecords || []).length > 0 ? (
                <div className="max-h-[300px] divide-y overflow-y-auto">
                  {(company.situsRecords || []).map((situs, idx) => (
                    <div key={idx} className="p-4 transition-colors hover:bg-muted/5">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="font-semibold text-sm">{situs.jurisdiction}</p>
                        <Badge variant="outline" className="font-normal text-xs">
                          {situs.type}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">Effective: {situs.effectiveDate}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <MapPin className="mx-auto mb-2 h-8 w-8 opacity-20" />
                  <p className="text-sm">No situs records available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-primary" /> Associated Clients
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {associatedClients.length > 0 ? (
                <div className="divide-y">
                  {associatedClients.map((client) => {
                    const person = client.person as any;
                    return (
                      <Link
                        key={client.id}
                        href={`/dashboard/crm/clients/${client.id}`}
                        className="group flex items-center justify-between p-4 transition-colors hover:bg-muted/5"
                      >
                        <div className="flex items-center gap-3">
                          <PersonAvatar
                            photoUrl={person?.photoUrl}
                            firstName={person?.firstName}
                            lastName={person?.lastName}
                            size="sm"
                          />
                          <div className="space-y-1">
                            <p className="font-semibold transition-colors group-hover:text-primary">
                              {person?.firstName} {person?.lastName}
                            </p>
                            <p className="flex items-center gap-2 text-muted-foreground text-xs">
                              {person?.email && <span>{person.email}</span>}
                              {person?.mobilePhone && (
                                <>
                                  <span>•</span>
                                  <span>{formatPhoneNumber(person.mobilePhone)}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <Users className="mx-auto mb-4 h-12 w-12 opacity-20" />
                  <p>No clients currently associated with this company.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-primary" /> Nexus Records
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(company.nexusRecords || []).length > 0 ? (
                <div className="max-h-[300px] divide-y overflow-y-auto">
                  {(company.nexusRecords || []).map((nexus, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 transition-colors hover:bg-muted/5">
                      <p className="font-semibold text-sm">{nexus.jurisdiction}</p>
                      <Badge variant="outline" className="font-normal text-xs">
                        {nexus.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <Briefcase className="mx-auto mb-2 h-8 w-8 opacity-20" />
                  <p className="text-sm">No nexus records available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Globe</title>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
