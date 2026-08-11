"use client";

import { useState } from "react";

import LinkNext from "next/link";

import { ArrowUpRight, Calendar, Search, Shield, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface Policy {
  id?: string;
  policyName: string;
  policyNumber: string;
  clientName: string;
  clientId: string;
  premiumAmount: number;
  paymentSchedule: string;
  renewalDate: string | Date;
}

interface ActivePoliciesListProps {
  initialPolicies: Policy[];
}

export function ActivePoliciesList({ initialPolicies }: ActivePoliciesListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPolicies = initialPolicies.filter((policy) =>
    policy.clientName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="border-b bg-muted/10 pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" /> Active Client Policies ({filteredPolicies.length})
          </CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {initialPolicies.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ShieldAlert className="mx-auto mb-2 h-10 w-10 opacity-20" />
            <p className="text-sm">
              No client policies are currently associated with this disability insurance company.
            </p>
          </div>
        ) : filteredPolicies.length > 0 ? (
          <div className="divide-y">
            {filteredPolicies.map((policy) => {
              const renewalDate = new Date(policy.renewalDate);
              return (
                <div key={policy.id} className="group flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{policy.policyName}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">({policy.policyNumber})</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        Client:{" "}
                        <LinkNext
                          href={`/dashboard/crm/clients/${policy.clientId}/disability-insurance`}
                          className="hover:underline text-primary flex items-center gap-0.5"
                        >
                          {policy.clientName}
                          <ArrowUpRight className="h-3 w-3 inline opacity-65" />
                        </LinkNext>
                      </span>
                      <span className="flex items-center gap-1 font-bold text-green-700">
                        Premium: {formatCurrency(policy.premiumAmount)} ({policy.paymentSchedule})
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Renewal: {renewalDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <LinkNext href={`/dashboard/crm/policies/${policy.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </LinkNext>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="mx-auto mb-2 h-10 w-10 opacity-20" />
            <p className="text-sm">No client policies match the search term "{searchQuery}".</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
