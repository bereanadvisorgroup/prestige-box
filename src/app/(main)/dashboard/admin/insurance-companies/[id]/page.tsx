import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowUpRight, Calendar, Globe, Pencil, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

import { getInsuranceCompany } from "@/actions/insurance-companies";
import { getClientPolicies } from "@/actions/policies";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface InsuranceCompanyPageProps {
  params: {
    id: string;
  };
}

export default async function InsuranceCompanyPage({ params }: InsuranceCompanyPageProps) {
  const { id } = await params;
  const result = await getInsuranceCompany(id);

  if (!result.success || !result.company) {
    notFound();
  }

  const company = result.company;

  // Fetch client policies linked to this carrier
  const policiesResult = await getClientPolicies();
  const allPolicies = policiesResult.success && policiesResult.policies ? policiesResult.policies : [];
  const linkedPolicies = allPolicies.filter((p) => p.insuranceCompanyId === company.id);

  return (
    <div className="fade-in mx-auto w-full max-w-6xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 rounded-md border-2 border-primary/10">
            <AvatarFallback className="rounded-md bg-primary/5 text-2xl text-primary">
              <Shield className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">{company.name}</h1>
            <p className="mt-1 flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              {company.websiteUrl ? (
                <a
                  href={company.websiteUrl.startsWith("http") ? company.websiteUrl : `https://${company.websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {company.websiteUrl.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                "No Website"
              )}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/admin/insurance-companies/${company.id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Carrier
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Policies Templates Card */}
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
        </div>

        {/* Client Policies list Card */}
        <div className="space-y-6 md:col-span-2">
          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" /> Active Client Policies ({linkedPolicies.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {linkedPolicies.length > 0 ? (
                <div className="divide-y">
                  {linkedPolicies.map((policy) => {
                    const renewalDate = new Date(policy.renewalDate);
                    return (
                      <div
                        key={policy.id}
                        className="group flex items-center justify-between py-4 first:pt-0 last:pb-0"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{policy.policyName}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">({policy.policyNumber})</span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              Client: {policy.clientName}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-green-700">
                              Premium: {formatCurrency(policy.premiumAmount)} ({policy.paymentSchedule})
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Renewal: {renewalDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Link href={`/dashboard/crm/policies/${policy.id}`}>
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
                  <ShieldAlert className="mx-auto mb-2 h-10 w-10 opacity-20" />
                  <p className="text-sm">No client policies are currently associated with this insurance company.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
