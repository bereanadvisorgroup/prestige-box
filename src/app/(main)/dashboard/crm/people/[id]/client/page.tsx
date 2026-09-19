import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowUpRight, Briefcase, CreditCard, Heart, Home, TrendingUp, User } from "lucide-react";

import { getBanks } from "@/actions/banks";
import { getClients } from "@/actions/clients";
import { getPerson } from "@/actions/people";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Employment, LoanInfo, MortgageInfo } from "@/types/crm";

import { PersonHeaderPortal } from "../_components/person-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonClientProfilePage({ params }: Props) {
  const { id } = await params;
  const [personRes, clientsRes, banksRes] = await Promise.all([getPerson(id), getClients(), getBanks()]);

  if (!personRes.success || !personRes.person) {
    notFound();
  }

  const clients = (clientsRes.success && clientsRes.clients) || [];
  const associatedClient = clients.find((c) => c.personId === id) || null;
  const banks = (banksRes.success && banksRes.banks) || [];

  if (!associatedClient) {
    return (
      <div className="py-4">
        <PersonHeaderPortal sectionName="Client Profile" />
        <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
          <CardHeader className="bg-muted/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-primary" /> Client Profile
            </CardTitle>
            <CardDescription>No client profile is linked to this person.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm italic">This person is not currently marked as a client.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const employments = (associatedClient.employments || []) as Employment[];
  const mortgages = (associatedClient.mortgages || []) as MortgageInfo[];
  const liabilities = (associatedClient.liabilities || []) as LoanInfo[];

  return (
    <div className="py-4">
      <PersonHeaderPortal sectionName="Client Profile" />
      <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 bg-muted/10 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" /> Client Profile
            </CardTitle>
            <CardDescription>Details of this person's client record</CardDescription>
          </div>
          <Link href={`/dashboard/crm/clients/${associatedClient.id}`}>
            <Button variant="outline" className="font-semibold shadow-sm">
              Go to Client Page <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {associatedClient.hobbies && associatedClient.hobbies.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                <Heart className="h-4 w-4 text-primary" /> Hobbies & Interests
              </h4>
              <div className="flex flex-wrap gap-2">
                {associatedClient.hobbies.map((h) => (
                  <Badge key={h} variant="secondary">
                    {h}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {associatedClient.favoriteSportsTeams && associatedClient.favoriteSportsTeams.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                <TrendingUp className="h-4 w-4 text-primary" /> Favorite Sports Teams
              </h4>
              <div className="flex flex-wrap gap-2">
                {associatedClient.favoriteSportsTeams.map((t) => (
                  <Badge key={t} variant="default" className="font-bold">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {employments.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="mb-3 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                <Briefcase className="h-4 w-4 text-primary" /> Employment History
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {employments.map((emp) => (
                  <div
                    key={emp.id || `${emp.employerName}-${emp.occupation}`}
                    className="rounded-lg border bg-card p-4 text-sm shadow-sm"
                  >
                    <p className="font-bold">{emp.occupation}</p>
                    <p className="mt-0.5 text-muted-foreground text-xs">{emp.employerName}</p>
                    {(emp.startDate || emp.endDate) && (
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {emp.startDate || "Present"} - {emp.endDate || "Present"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(mortgages.length > 0 || liabilities.length > 0) && (
            <div className="grid grid-cols-1 gap-6 border-t pt-4 md:grid-cols-2">
              {mortgages.length > 0 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                    <Home className="h-4 w-4 text-primary" /> Mortgages
                  </h4>
                  <div className="space-y-2">
                    {mortgages.map((m, idx) => (
                      <div
                        key={m.id || `mortgage-${idx}`}
                        className="space-y-1 rounded-lg border bg-card p-3 text-xs shadow-sm"
                      >
                        {m.purchasePrice && (
                          <p className="font-medium">
                            Purchase Price: <span className="font-bold">${m.purchasePrice.toLocaleString()}</span>
                          </p>
                        )}
                        {m.currentMarketValue && (
                          <p className="font-medium text-muted-foreground">
                            Current Market Value:{" "}
                            <span className="font-bold">${m.currentMarketValue.toLocaleString()}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {liabilities.length > 0 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
                    <CreditCard className="h-4 w-4 text-primary" /> Liabilities
                  </h4>
                  <div className="space-y-2">
                    {liabilities.map((l, idx) => (
                      <div
                        key={l.id || `liability-${idx}`}
                        className="space-y-1 rounded-lg border bg-card p-3 text-xs shadow-sm"
                      >
                        <p className="font-bold">{banks.find((b) => b.id === l.bankId)?.firmName || "Unknown Bank"}</p>
                        <p className="font-semibold text-muted-foreground">
                          Type: <span className="text-foreground">{l.loanType}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Balance:{" "}
                          <span className="font-bold font-mono text-foreground">
                            ${l.currentBalance.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
