"use client";

import * as React from "react";

import Link from "next/link";

import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { ArrowUpRight, Briefcase, Calendar, CheckCircle2 } from "lucide-react";

import { getAssignedActiveOpportunitiesForUser } from "@/actions/opportunities";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatPersonName } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import type { Opportunity } from "@/types/crm";

export interface AssignedOpportunity extends Opportunity {
  client?: {
    id: string;
    personId: string;
    person?: {
      id: string;
      firstName: string;
      lastName: string;
      suffix?: string | null;
      photoUrl?: string | null;
    } | null;
  } | null;
  company?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  } | null;
  pipeline?: {
    id: string;
    name: string;
  } | null;
  stage?: {
    id: string;
    name: string;
    order: number;
  } | null;
  updatedBy?: {
    uid: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export function AssignedOpportunitiesCard() {
  const profile = useAuthStore((s) => s.profile);
  const [opportunities, setOpportunities] = React.useState<AssignedOpportunity[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!profile?.uid) return;
    let cancelled = false;

    (async () => {
      const res = await getAssignedActiveOpportunitiesForUser(profile.uid);
      if (!cancelled) {
        if (res.success && res.opportunities) {
          setOpportunities(res.opportunities);
        }
        setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.uid]);

  return (
    <Card className="group transition-all hover:border-primary/50 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 font-bold text-base">
          <Briefcase className="h-5 w-5 text-primary" />
          My Assigned Opportunities
        </CardTitle>
        <Link
          href="/dashboard/crm/opportunities"
          className="flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-primary"
        >
          View all
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : opportunities.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            No active assigned opportunities.
          </div>
        ) : (
          <ul className="space-y-3">
            {opportunities.map((opp) => {
              const name = formatPersonName(opp.client?.person, "Unnamed Client");

              const formattedAmount = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(Number.parseFloat(opp.amount || "0"));

              const closeDateStr = opp.targetCloseDate ? format(new Date(opp.targetCloseDate), "MMM d, yyyy") : null;

              // Calculate date status colors to match opportunity cards
              let dateStatus: "error" | "warning" | "none" = "none";
              if (opp.targetCloseDate) {
                const today = startOfDay(new Date());
                const targetDate = startOfDay(new Date(opp.targetCloseDate));
                const diffDays = differenceInCalendarDays(targetDate, today);

                if (diffDays <= 0) {
                  dateStatus = "error";
                } else if (diffDays <= 7) {
                  dateStatus = "warning";
                }
              }

              return (
                <li key={opp.id}>
                  <Link
                    href={`/dashboard/crm/clients/${opp.clientId}/internal/opportunities`}
                    className={cn(
                      "group/item block rounded-lg border p-3 transition-all hover:border-primary/30 hover:shadow-sm",
                      dateStatus === "error" &&
                        "border-rose-200 bg-rose-50/90 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-100",
                      dateStatus === "warning" &&
                        "border-amber-200 bg-amber-50/90 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100",
                      dateStatus === "none" && "border-border bg-card hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-primary text-sm hover:underline">
                          <span className="truncate">{name}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover/item:opacity-100" />
                        </div>
                        <p className="truncate text-muted-foreground text-xs">
                          {opp.pipeline?.name || "N/A"} · {opp.stage?.name || "N/A"}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-5 gap-0.5 px-1.5 font-semibold text-[10px]",
                          dateStatus === "error"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : dateStatus === "warning"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
                        )}
                      >
                        {opp.probabilityWin}% Win
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between border-muted-foreground/10 border-t border-dashed pt-2">
                      <span className="font-extrabold text-foreground text-sm">{formattedAmount}</span>
                      {closeDateStr && (
                        <span
                          className={cn(
                            "flex items-center gap-1 font-medium text-[10px]",
                            dateStatus === "error" && "text-rose-700 dark:text-rose-400",
                            dateStatus === "warning" && "text-amber-700 dark:text-amber-400",
                            dateStatus === "none" && "text-muted-foreground",
                          )}
                        >
                          <Calendar className="inline h-3 w-3" />
                          <span>Close: {closeDateStr}</span>
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
