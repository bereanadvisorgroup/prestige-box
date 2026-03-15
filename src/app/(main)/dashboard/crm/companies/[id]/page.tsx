import Link from "next/link";
import { notFound } from "next/navigation";

import { Briefcase, Building2, ExternalLink, Fingerprint, MapPin, Pencil, Phone, Users } from "lucide-react";

import { getAddress } from "@/actions/addresses";
import { getClients } from "@/actions/clients";
import { getCompany } from "@/actions/companies";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/utils";
import type { Company } from "@/types/crm";

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
  const associatedClients = (allClientsResult.success && allClientsResult.clients ? allClientsResult.clients : []).filter((c) =>
    (company.clientIds || []).includes(c.id!),
  );

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 md:px-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10 rounded-md">
            <AvatarFallback className="text-2xl bg-primary/5 text-primary rounded-md">
              <Building2 className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4" /> Company ID: {company.id}
            </p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="overflow-hidden border-none shadow-md bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">Contact & Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {company.dba && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Doing Business As</p>
                    <p className="text-sm font-semibold mt-1">{company.dba}</p>
                  </div>
                </div>
              )}
              {company.ein && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <Fingerprint className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Federal Tax ID (EIN)</p>
                    <p className="text-sm font-semibold mt-1 font-mono">{company.ein}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <GlobeIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Website</p>
                  {company.website ? (
                    <a
                      href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      {company.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm font-semibold mt-1">N/A</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-semibold mt-1">{formatPhoneNumber(company.phone) || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</p>
                  {address ? (
                    <div className="text-sm font-semibold mt-1">
                      <p>{address.street1}</p>
                      {address.street2 && <p>{address.street2}</p>}
                      <p>
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">{address.country}</p>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold mt-1">N/A</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Situs Records
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(company.situsRecords || []).length > 0 ? (
                <div className="divide-y max-h-[300px] overflow-y-auto">
                  {(company.situsRecords || []).map((situs, idx) => (
                    <div key={idx} className="p-4 hover:bg-muted/5 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm">{situs.jurisdiction}</p>
                        <Badge variant="outline" className="text-xs font-normal">{situs.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Effective: {situs.effectiveDate}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No situs records available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md h-full">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 pb-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
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
                        className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors group block"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold group-hover:text-primary transition-colors">
                            {person?.firstName} {person?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            {person?.email && <span>{person.email}</span>}
                            {person?.mobilePhone && (
                              <>
                                <span>•</span>
                                <span>{formatPhoneNumber(person.mobilePhone)}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No clients currently associated with this company.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" /> Nexus Records
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(company.nexusRecords || []).length > 0 ? (
                <div className="divide-y max-h-[300px] overflow-y-auto">
                  {(company.nexusRecords || []).map((nexus, idx) => (
                    <div key={idx} className="p-4 hover:bg-muted/5 transition-colors flex items-center justify-between">
                      <p className="font-semibold text-sm">{nexus.jurisdiction}</p>
                      <Badge variant="outline" className="text-xs font-normal">{nexus.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-20" />
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
      xmlns="http://www.w3.org/0rem"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
