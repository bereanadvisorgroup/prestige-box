import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowUpRight,
  Briefcase,
  Building2,
  ExternalLink,
  Fingerprint,
  MapPin,
  Phone,
  UserCog,
  Users,
} from "lucide-react";

import { getAddress } from "@/actions/addresses";
import { getCompany } from "@/actions/companies";
import { getUser } from "@/actions/users";
import { PersonAvatar } from "@/components/crm/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";

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

  let advisor = null;
  if (company.advisorId) {
    const advisorResult = await getUser(company.advisorId);
    advisor = advisorResult.success ? advisorResult.user : null;
  }

  const owners = company.owners || [];

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="overflow-hidden border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">Company Information</CardTitle>
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

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <UserCog className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Assigned Advisor</p>
                  {advisor ? (
                    <div className="mt-1 flex items-center gap-2">
                      <PersonAvatar
                        photoUrl={advisor.photoURL}
                        firstName={advisor.firstName}
                        lastName={advisor.lastName}
                        size="sm"
                      />
                      <span className="font-semibold text-sm">
                        {advisor.firstName} {advisor.lastName}
                      </span>
                      {advisor.role && (
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] capitalize">
                          {advisor.role}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-muted-foreground/60 text-sm italic">Unassigned</p>
                  )}
                </div>
              </div>

              {company.socialMedia && company.socialMedia.length > 0 && (
                <div className="border-t pt-4">
                  <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    Social Media Accounts
                  </p>
                  <div className="space-y-2">
                    {company.socialMedia.map((sm: any) => (
                      <div key={sm.id} className="flex items-center gap-2 text-sm">
                        <GlobeIcon className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={sm.url.startsWith("http") ? sm.url : `https://${sm.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {sm.type}
                        </a>
                        <Badge variant={sm.isPrimary ? "default" : "outline"} className="px-1.5 py-0 text-[10px]">
                          {sm.isPrimary ? "Primary" : "Secondary"}
                          {sm.useProfilePhoto && " (Using Photo)"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-primary" /> Company Owners
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {owners.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-muted-foreground text-xs uppercase">
                        <th className="p-4 font-semibold">Owner</th>
                        <th className="p-4 text-right font-semibold">Ownership</th>
                        <th className="p-4 text-center font-semibold">Status</th>
                        <th className="p-4 text-right font-semibold">Estimated Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {owners.map((owner: any) => {
                        const person = owner.person;
                        const name = person ? `${person.firstName} ${person.lastName}` : "Unknown Person";
                        const linkHref = owner.isClient
                          ? `/dashboard/crm/clients/${owner.clientId}`
                          : `/dashboard/crm/people/${owner.personId}`;
                        const percentage = Number(owner.ownershipPercentage) || 0;
                        const ownerValue = (percentage / 100) * (Number(company.estimatedValue) || 0);

                        return (
                          <tr key={owner.id} className="transition-colors hover:bg-muted/5">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <PersonAvatar
                                  photoUrl={person?.photoUrl}
                                  firstName={person?.firstName}
                                  lastName={person?.lastName}
                                  size="sm"
                                />
                                <Link
                                  href={linkHref}
                                  className="flex items-center gap-1 font-semibold text-primary hover:underline"
                                >
                                  <span>{name}</span>
                                  <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                                </Link>
                              </div>
                            </td>
                            <td className="p-4 text-right font-medium">{percentage.toFixed(2)}%</td>
                            <td className="p-4 text-center">
                              {owner.isClient ? (
                                <Badge
                                  className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  variant="outline"
                                >
                                  Client
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-muted-foreground/20 text-muted-foreground">
                                  Non-Client
                                </Badge>
                              )}
                            </td>
                            <td className="p-4 text-right font-semibold text-sm">{formatCurrency(ownerValue)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <Users className="mx-auto mb-4 h-12 w-12 opacity-20" />
                  <p>No owners currently associated with this company.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" /> Situs Records
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(company.situsRecords || []).length > 0 ? (
                  <div className="max-h-[300px] divide-y overflow-y-auto">
                    {((company.situsRecords as any[]) || []).map((situs: any, idx: number) => (
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

            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5 text-primary" /> Nexus Records
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(company.nexusRecords || []).length > 0 ? (
                  <div className="max-h-[300px] divide-y overflow-y-auto">
                    {((company.nexusRecords as any[]) || []).map((nexus: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 transition-colors hover:bg-muted/5"
                      >
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
