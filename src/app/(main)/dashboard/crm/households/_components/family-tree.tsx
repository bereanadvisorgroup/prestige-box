"use client";

import Link from "next/link";

import {
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Heart,
  Home,
  Shield,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";

import { PersonAvatar } from "@/components/features/crm/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateHouseholdNetWorth } from "@/lib/financial-rollup";
import { formatPersonName } from "@/lib/utils";
import type { Household, Person } from "@/types/crm";

interface FamilyTreeMember {
  person: Person | null;
  clientId: string;
  role: string;
  isPrimaryHousehold: boolean;
  includeInFinancialRollup: boolean;
  familyRelationship?: string;
  parentage?: "BOTH" | "HEAD" | "SPOUSE";
  relatedTo?: "HEAD" | "SPOUSE";
  tags?: string[];
}

interface FamilyTreeProps {
  household: Household;
  members: FamilyTreeMember[];
}

const DESCENDANT_ROLES = [
  "SON",
  "DAUGHTER",
  "GRANDSON",
  "GRANDDAUGHTER",
  "GREAT_GRANDSON",
  "GREAT_GRANDDAUGHTER",
  "DEPENDENT",
];

function isDescendantRole(role: string) {
  return DESCENDANT_ROLES.includes(role);
}

function formatRoleName(role: string): string {
  const roleMap: Record<string, string> = {
    HEAD: "Head of Household",
    SPOUSE: "Spouse",
    PARTNER: "Partner",
    SON: "Son",
    DAUGHTER: "Daughter",
    GRANDSON: "Grandson",
    GRANDDAUGHTER: "Granddaughter",
    GREAT_GRANDSON: "Great Grandson",
    GREAT_GRANDDAUGHTER: "Great Granddaughter",
    COUSIN: "Cousin",
    UNCLE: "Uncle",
    AUNT: "Aunt",
    NEPHEW: "Nephew",
    NIECE: "Niece",
    BROTHER: "Brother",
    SISTER: "Sister",
    FATHER: "Father",
    MOTHER: "Mother",
    GRANDFATHER: "Grandfather",
    GRANDMOTHER: "Grandmother",
    IN_LAW: "In-Law",
    OTHER: "Other Relative",
    TRUSTEE: "Trustee",
    DEPENDENT: "Dependent",
    MEMBER: "Member",
  };
  return roleMap[role] || role;
}

export function FamilyTree({ household, members }: FamilyTreeProps) {
  // Compute aggregated household financial summary
  const summary = calculateHouseholdNetWorth(household, [], []);

  const headMember = members.find((m) => m.role === "HEAD");
  const spouseMember = members.find((m) => ["SPOUSE", "PARTNER"].includes(m.role));

  const descendantMembers = members.filter(
    (m) => m.role !== "HEAD" && !["SPOUSE", "PARTNER"].includes(m.role) && isDescendantRole(m.role),
  );

  const children = descendantMembers.filter((m) => ["SON", "DAUGHTER", "DEPENDENT"].includes(m.role));
  const grandchildren = descendantMembers.filter((m) => ["GRANDSON", "GRANDDAUGHTER"].includes(m.role));
  const greatGrandchildren = descendantMembers.filter((m) =>
    ["GREAT_GRANDSON", "GREAT_GRANDDAUGHTER"].includes(m.role),
  );

  // Collateral relatives (not direct descendants, not Head/Spouse)
  const collateralMembers = members.filter(
    (m) => m.role !== "HEAD" && !["SPOUSE", "PARTNER"].includes(m.role) && !isDescendantRole(m.role),
  );

  // Left Column: Collateral related to Head
  const leftSideMembers = collateralMembers.filter((m) => m.relatedTo !== "SPOUSE");

  // Right Column: Collateral related to Spouse
  const rightSideMembers = collateralMembers.filter((m) => m.relatedTo === "SPOUSE");

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

      {/* Visual 3-Column Family Tree Graph */}
      <Card className="border-none shadow-md">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-primary" /> Visual Family Structure & Tree
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Head of Household's Side (Extended Relatives) */}
            <div className="lg:col-span-3 space-y-4 rounded-xl border bg-muted/5 p-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-primary" /> Head's Extended Family
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  {leftSideMembers.length}
                </Badge>
              </div>

              <div className="space-y-3">
                {leftSideMembers.map((m) => {
                  const isTrustee = (m.tags || []).includes("Trustee") || m.role === "TRUSTEE";
                  return (
                    <div
                      key={m.clientId}
                      className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-2xs transition-all hover:shadow-xs"
                    >
                      <PersonAvatar
                        photoUrl={m.person?.photoUrl}
                        firstName={m.person?.firstName}
                        lastName={m.person?.lastName}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-xs">{formatPersonName(m.person, "Relative")}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-[9px]">
                            {formatRoleName(m.role)}
                          </Badge>
                          {isTrustee && (
                            <Badge className="bg-amber-500 text-white text-[9px] gap-0.5">
                              <ShieldCheck className="h-2.5 w-2.5" /> Trustee
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {leftSideMembers.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground italic">
                    No collateral relatives added for Head of Household.
                  </p>
                )}
              </div>
            </div>

            {/* Center Column: Direct Descendants & Primary Core */}
            <div className="lg:col-span-6 flex flex-col items-center gap-8 py-2">
              {/* Level 1: Primary Couple */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                {headMember ? (
                  <div className="relative flex w-60 items-center gap-3 rounded-xl border-2 border-primary/40 bg-card p-4 shadow-sm">
                    <PersonAvatar
                      photoUrl={headMember.person?.photoUrl}
                      firstName={headMember.person?.firstName}
                      lastName={headMember.person?.lastName}
                      size="default"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-sm">{formatPersonName(headMember.person, "Head")}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="default" className="text-[10px]">
                          Head of Household
                        </Badge>
                        {((headMember.tags || []).includes("Trustee") || headMember.role === "TRUSTEE") && (
                          <Badge className="bg-amber-500 text-white text-[9px] gap-0.5">
                            <ShieldCheck className="h-2.5 w-2.5" /> Trustee
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-20 w-56 items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">
                    No Head Assigned
                  </div>
                )}

                {headMember && spouseMember && (
                  <div className="flex flex-col items-center justify-center">
                    <Heart className="h-5 w-5 text-rose-500 fill-rose-500/20" />
                    <span className="text-[9px] text-muted-foreground font-medium">Married / Partnered</span>
                  </div>
                )}

                {spouseMember && (
                  <div className="relative flex w-60 items-center gap-3 rounded-xl border-2 border-rose-500/40 bg-card p-4 shadow-sm">
                    <PersonAvatar
                      photoUrl={spouseMember.person?.photoUrl}
                      firstName={spouseMember.person?.firstName}
                      lastName={spouseMember.person?.lastName}
                      size="default"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-sm">{formatPersonName(spouseMember.person, "Spouse")}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge
                          variant="secondary"
                          className="bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px]"
                        >
                          {formatRoleName(spouseMember.role)}
                        </Badge>
                        {((spouseMember.tags || []).includes("Trustee") || spouseMember.role === "TRUSTEE") && (
                          <Badge className="bg-amber-500 text-white text-[9px] gap-0.5">
                            <ShieldCheck className="h-2.5 w-2.5" /> Trustee
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Connector */}
              {descendantMembers.length > 0 && (
                <div className="relative flex flex-col items-center">
                  <div className="h-6 w-0.5 bg-border" />
                  <div className="rounded-full border bg-muted/20 px-3 py-1 font-semibold text-[11px] text-muted-foreground">
                    Direct Descendants & Lineage
                  </div>
                  <div className="h-6 w-0.5 bg-border" />
                </div>
              )}

              {/* Generation 1: Children */}
              {children.length > 0 && (
                <div className="w-full space-y-4">
                  <div className="flex flex-wrap justify-center gap-4">
                    {children.map((m) => {
                      const isTrustee = (m.tags || []).includes("Trustee") || m.role === "TRUSTEE";
                      const parentage = m.parentage || "BOTH";

                      let parentageLabel = "Joint Child";
                      let parentageStyle = "border-primary/20 bg-card";
                      if (parentage === "HEAD") {
                        parentageLabel = "Head's Child / Step to Spouse";
                        parentageStyle = "border-blue-500/30 bg-blue-500/5";
                      } else if (parentage === "SPOUSE") {
                        parentageLabel = "Spouse's Child / Step to Head";
                        parentageStyle = "border-rose-500/30 bg-rose-500/5";
                      }

                      return (
                        <div
                          key={m.clientId}
                          className={`flex w-56 items-center gap-3 rounded-lg border p-3 shadow-2xs ${parentageStyle}`}
                        >
                          <PersonAvatar
                            photoUrl={m.person?.photoUrl}
                            firstName={m.person?.firstName}
                            lastName={m.person?.lastName}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-xs">{formatPersonName(m.person, "Child")}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-[9px]">
                                {formatRoleName(m.role)}
                              </Badge>
                              <Badge variant="secondary" className="text-[8px]">
                                {parentageLabel}
                              </Badge>
                              {isTrustee && (
                                <Badge className="bg-amber-500 text-white text-[9px] gap-0.5">
                                  <ShieldCheck className="h-2.5 w-2.5" /> Trustee
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Generation 2: Grandchildren */}
              {grandchildren.length > 0 && (
                <div className="w-full space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground justify-center">
                    <div className="h-px bg-border flex-1" />
                    <span>Grandchildren</span>
                    <div className="h-px bg-border flex-1" />
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {grandchildren.map((m) => {
                      const isTrustee = (m.tags || []).includes("Trustee") || m.role === "TRUSTEE";
                      return (
                        <div
                          key={m.clientId}
                          className="flex items-center gap-2 rounded-lg border bg-card p-2.5 shadow-2xs text-xs"
                        >
                          <PersonAvatar
                            photoUrl={m.person?.photoUrl}
                            firstName={m.person?.firstName}
                            lastName={m.person?.lastName}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-xs">{formatPersonName(m.person, "Grandchild")}</p>
                            <div className="mt-0.5 flex gap-1">
                              <Badge variant="outline" className="text-[8px]">
                                {formatRoleName(m.role)}
                              </Badge>
                              {isTrustee && <Badge className="bg-amber-500 text-white text-[8px]">Trustee</Badge>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Generation 3: Great Grandchildren */}
              {greatGrandchildren.length > 0 && (
                <div className="w-full space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground justify-center">
                    <div className="h-px bg-border flex-1" />
                    <span>Great Grandchildren</span>
                    <div className="h-px bg-border flex-1" />
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {greatGrandchildren.map((m) => {
                      const isTrustee = (m.tags || []).includes("Trustee") || m.role === "TRUSTEE";
                      return (
                        <div
                          key={m.clientId}
                          className="flex items-center gap-2 rounded-lg border bg-card p-2.5 shadow-2xs text-xs"
                        >
                          <PersonAvatar
                            photoUrl={m.person?.photoUrl}
                            firstName={m.person?.firstName}
                            lastName={m.person?.lastName}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-xs">{formatPersonName(m.person, "Great Grandchild")}</p>
                            <div className="mt-0.5 flex gap-1">
                              <Badge variant="outline" className="text-[8px]">
                                {formatRoleName(m.role)}
                              </Badge>
                              {isTrustee && <Badge className="bg-amber-500 text-white text-[8px]">Trustee</Badge>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {descendantMembers.length === 0 && (
                <p className="py-2 text-center text-xs text-muted-foreground italic">
                  No direct descendants added to this household tree yet.
                </p>
              )}
            </div>

            {/* Right Column: Spouse / Partner's Side (Extended Relatives) */}
            <div className="lg:col-span-3 space-y-4 rounded-xl border bg-rose-500/5 p-4">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-rose-500" /> Spouse's Extended Family
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  {rightSideMembers.length}
                </Badge>
              </div>

              <div className="space-y-3">
                {rightSideMembers.map((m) => {
                  const isTrustee = (m.tags || []).includes("Trustee") || m.role === "TRUSTEE";
                  return (
                    <div
                      key={m.clientId}
                      className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-2xs transition-all hover:shadow-xs"
                    >
                      <PersonAvatar
                        photoUrl={m.person?.photoUrl}
                        firstName={m.person?.firstName}
                        lastName={m.person?.lastName}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-xs">{formatPersonName(m.person, "Relative")}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-[9px]">
                            {formatRoleName(m.role)}
                          </Badge>
                          {isTrustee && (
                            <Badge className="bg-amber-500 text-white text-[9px] gap-0.5">
                              <ShieldCheck className="h-2.5 w-2.5" /> Trustee
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {rightSideMembers.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground italic">
                    No collateral relatives added for Spouse / Partner.
                  </p>
                )}
              </div>
            </div>
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
                <TableHead>Role & Relationship</TableHead>
                <TableHead>Parentage / Target</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Primary Household</TableHead>
                <TableHead>Financial Rollup</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const person = m.person;
                if (!person) return null;
                const isTrustee = (m.tags || []).includes("Trustee") || m.role === "TRUSTEE";

                let targetDesc = "—";
                if (isDescendantRole(m.role)) {
                  if (m.parentage === "HEAD") targetDesc = "Child of Head (Step to Spouse)";
                  else if (m.parentage === "SPOUSE") targetDesc = "Child of Spouse (Step to Head)";
                  else targetDesc = "Child of Head & Spouse (Joint)";
                } else if (m.role !== "HEAD" && !["SPOUSE", "PARTNER"].includes(m.role)) {
                  targetDesc =
                    m.relatedTo === "SPOUSE" ? "Related to Spouse / Partner" : "Related to Head of Household";
                }

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
                          <span>{formatPersonName(person)}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatRoleName(m.role)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{targetDesc}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {isTrustee && (
                          <Badge className="bg-amber-500 text-white text-[9px] gap-0.5">
                            <ShieldCheck className="h-2.5 w-2.5" /> Trustee
                          </Badge>
                        )}
                        {(m.tags || [])
                          .filter((t) => t !== "Trustee")
                          .map((t) => (
                            <Badge key={t} variant="secondary" className="text-[9px]">
                              {t}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
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
