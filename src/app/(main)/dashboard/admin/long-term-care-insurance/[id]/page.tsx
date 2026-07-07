import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowUpRight,
  Building2,
  Globe,
  Mail,
  Pencil,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

import { getCompanies } from "@/actions/companies";
import { getLongTermCareInsurance } from "@/actions/long-term-care-insurance";
import { getClientPolicies } from "@/actions/policies";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FirmLogo } from "@/components/crm/firm-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPhoneNumber } from "@/lib/utils";

import { ActivePoliciesList } from "../_components/active-policies-list";

interface LongTermCareInsurancePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LongTermCareInsurancePage({ params }: LongTermCareInsurancePageProps) {
  const { id } = await params;
  const result = await getLongTermCareInsurance(id);

  if (!result.success || !result.company) {
    notFound();
  }

  const company = result.company;
  const people = (result.people || []) as import("@/types/crm").Person[];

  // Fetch client policies linked to this carrier
  const policiesResult = await getClientPolicies();
  const allPolicies = policiesResult.success && policiesResult.policies ? policiesResult.policies : [];
  const linkedPolicies = allPolicies.filter((p) => p.longTermCareInsuranceId === company.id);

  // Fetch associated companies
  const companiesResult = await getCompanies();
  const allCompanies = companiesResult.success && companiesResult.companies ? companiesResult.companies : [];
  const associatedCompanies = allCompanies.filter((c) => (company.companyIds || []).includes(c.id!));

  return (
    <div className="fade-in mx-auto w-full max-w-6xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <FirmLogo
            logoUrl={company.logoUrl}
            name={company.name}
            className="h-20 w-20 rounded-md border-2 border-primary/10"
            size="lg"
          />
          <div>
            <h1 className="font-bold text-3xl tracking-tight">{company.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
              {company.websiteUrl && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  <a
                    href={company.websiteUrl.startsWith("http") ? company.websiteUrl : `https://${company.websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {company.websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                </span>
              )}
              {company.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${company.phone}`} className="text-foreground hover:underline">
                    {formatPhoneNumber(company.phone)}
                  </a>
                </span>
              )}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/admin/long-term-care-insurance/${company.id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Carrier
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Policies Templates & Associated Professionals Card */}
        <div className="space-y-6 md:col-span-1">
          <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" /> Supported Policies
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {company.policyNames && company.policyNames.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {company.policyNames.map((policy, idx) => (
                    <Badge key={idx} variant="secondary" className="w-full justify-start px-3 py-1.5 text-xs">
                      {policy}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  <ShieldAlert className="mx-auto mb-2 h-8 w-8 opacity-20" />
                  <p>No supported policy types specified.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
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
                            <AvatarFallback className="bg-primary/5 font-bold text-primary text-xs">
                              {person.firstName?.[0] || ""}
                              {person.lastName?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              href={`/dashboard/crm/people/${person.id}`}
                              className="flex items-center gap-0.5 font-semibold text-primary text-sm hover:underline"
                            >
                              {person.firstName} {person.lastName}
                              <ArrowUpRight className="h-3 w-3 opacity-60" />
                            </Link>
                            <p className="font-medium text-muted-foreground text-xs">Insurance Professional</p>
                          </div>
                        </div>

                        <div className="space-y-1 pl-13 text-xs">
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
            </CardContent>
          </Card>
        </div>

        {/* Client Policies & Associated Companies list Card */}
        <div className="space-y-6 md:col-span-2">
          <ActivePoliciesList initialPolicies={linkedPolicies} />

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Associated Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {associatedCompanies.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {associatedCompanies.map((c) => (
                    <Link
                      key={c.id}
                      href={`/dashboard/crm/companies/${c.id}`}
                      className="group flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-sm transition-colors group-hover:text-primary">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {c.name}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {c.website && <span className="mr-3">{c.website.replace(/^https?:\/\//, "")}</span>}
                          {c.phone && <span>{formatPhoneNumber(c.phone)}</span>}
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/20 py-10 text-center text-muted-foreground">
                  <p>No associated companies found.</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href={`/dashboard/admin/long-term-care-insurance/${company.id}/edit`}>Link Companies</Link>
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
