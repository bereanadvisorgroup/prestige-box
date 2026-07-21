"use client";

import Link from "next/link";
import { ArrowUpRight, DollarSign, Home, CheckCircle2, XCircle, Shield, UserCheck, Heart } from "lucide-react";

import { PersonAvatar } from "@/components/crm/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Household, Person } from "@/types/crm";
import { calculateHouseholdNetWorth } from "@/lib/financial-rollup";

interface FamilyTreeProps {
  household: Household;
  members: Array<{
    person: Person | null;
    clientId: string;
    role: string;
    isPrimaryHousehold: boolean;
    includeInFinancialRollup: boolean;
    familyRelationship?: string;
  }>;
}

export function FamilyTree({ household, members }: FamilyTreeProps) {
  // Compute aggregated household financial summary
  const summary = calculateHouseholdNetWorth(household, [], []);

  const headsAndSpouses = members.filter((m) => ["HEAD", "SPOUSE", "PARTNER"].includes(m.role));
  const dependents = members.filter((m) => m.role === "DEPENDENT");
  const others = members.filter((m) => ["TRUSTEE", "MEMBER"].includes(m.role));

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-none bg-gradient-to-br from-emerald-500/10 via-card to-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Aggregated Net Worth
                </p>
                <p className="mt-1 font-bold text-2xl text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(summary.netWorth)}
                </p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-gradient-to-br from-blue-500/10 via-card to-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Total Aggregated Assets
                </p>
                <p className="mt-1 font-bold text-2xl text-blue-600 dark:text-blue-400">
                  {formatCurrency(summary.totalAssets)}
                </p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3 text-blue-500">
                <Home className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-gradient-to-br from-rose-500/10 via-card to-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Total Aggregated Liabilities
                </p>
                <p className="mt-1 font-bold text-2xl text-rose-600 dark:text-rose-400">
                  {formatCurrency(summary.totalLiabilities)}
                </p>
              </div>
              <div className="rounded-full bg-rose-500/10 p-3 text-rose-500">
                <Shield className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Family Tree Graph */}
      <Card className="border-none shadow-md">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-primary" /> Visual Family Structure
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-8">
            {/* Level 1: Heads & Spouses */}
            {headsAndSpouses.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-6">
                {headsAndSpouses.map((m) => (
                  <div
                    key={m.clientId}
                    className="relative flex w-64 items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <PersonAvatar
                      photoUrl={m.person?.photoUrl}
                      firstName={m.person?.firstName}
                      lastName={m.person?.lastName}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-sm">
                        {m.person ? `${m.person.firstName} ${m.person.lastName}` : "Member"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="default" className="text-[10px]">
                          {m.role}
                        </Badge>
                        {m.includeInFinancialRollup ? (
                          <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-600">
                            Rollup Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Excluded
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tree Branch Line */}
            {dependents.length > 0 && (
              <div className="relative flex flex-col items-center">
                <div className="h-8 w-0.5 bg-border" />
                <div className="rounded-full border bg-muted/20 px-3 py-1 text-[11px] text-muted-foreground font-medium">
                  Children & Dependents
                </div>
                <div className="h-8 w-0.5 bg-border" />
              </div>
            )}

            {/* Level 2: Dependents */}
            {dependents.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6">
                {dependents.map((m) => (
                  <div
                    key={m.clientId}
                    className="flex w-56 items-center gap-3 rounded-lg border bg-card p-3 shadow-xs"
                  >
                    <PersonAvatar
                      photoUrl={m.person?.photoUrl}
                      firstName={m.person?.firstName}
                      lastName={m.person?.lastName}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-xs">
                        {m.person ? `${m.person.firstName} ${m.person.lastName}` : "Dependent"}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-[9px]">
                        {m.familyRelationship || "Dependent"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Level 3: Trustees & Other Members */}
            {others.length > 0 && (
              <>
                <div className="h-6 w-0.5 bg-border" />
                <div className="flex flex-wrap justify-center gap-4">
                  {others.map((m) => (
                    <div
                      key={m.clientId}
                      className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-xs"
                    >
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span>{m.person ? `${m.person.firstName} ${m.person.lastName}` : "Member"}</span>
                      <Badge variant="outline" className="text-[9px]">
                        {m.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Family Members Matrix Table */}
      <Card className="border-none shadow-md">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <CardTitle className="text-lg">Family Members & Rollup Controls</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Primary Household</TableHead>
                <TableHead>Financial Rollup</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const person = m.person;
                if (!person) return null;

                return (
                  <TableRow key={m.clientId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/crm/people/${person.id}`}
                          className="flex items-center gap-2 font-semibold hover:underline"
                        >
                          <PersonAvatar
                            photoUrl={person.photoUrl}
                            firstName={person.firstName}
                            lastName={person.lastName}
                            size="sm"
                          />
                          <span>
                            {person.firstName} {person.lastName}
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{m.familyRelationship || "Member"}</TableCell>
                    <TableCell>
                      {m.isPrimaryHousehold ? (
                        <Badge variant="default" className="bg-emerald-600 text-[10px]">
                          Primary
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Secondary
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {m.includeInFinancialRollup ? (
                        <span className="flex items-center gap-1 font-medium text-emerald-600 text-xs dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" /> Included
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-medium text-muted-foreground text-xs">
                          <XCircle className="h-4 w-4" /> Excluded
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/crm/people/${person.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                          View Person
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
