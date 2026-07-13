"use client";

import * as React from "react";

import Link from "next/link";

import { format } from "date-fns";
import { ArrowUpRight, Building2, Calendar, Clock, User, Workflow } from "lucide-react";

import { getUpcomingWorkflowStepsForUser } from "@/actions/workflows";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

interface WorkflowStepExtended {
  id: string;
  name: string;
  workflowId: string;
  workflowName: string;
  entityType: "client" | "company";
  entityId: string;
  entityName: string;
  priority: string;
  responsibility: string;
  dueDate: string | null;
  createdAt: string;
}

const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-none",
  High: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-none",
  None: "bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 border-none",
};

export function MyWorkflowTasksCard() {
  const profile = useAuthStore((s) => s.profile);
  const [steps, setSteps] = React.useState<WorkflowStepExtended[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!profile?.uid) return;
    let cancelled = false;
    (async () => {
      const res = await getUpcomingWorkflowStepsForUser(profile.uid, 5);
      if (!cancelled) {
        if (res.success && res.steps) {
          setSteps(res.steps);
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
          <Workflow className="h-5 w-5 text-primary" />
          My Workflow Steps
        </CardTitle>
        <Link
          href="/dashboard/crm/workflows"
          className="flex items-center gap-1 text-muted-foreground text-xs hover:text-primary"
        >
          View all
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : steps.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
            <Workflow className="h-4 w-4 text-muted-foreground/50" />
            No workflow tasks assigned.
          </div>
        ) : (
          <ul className="divide-y">
            {steps.map((step) => {
              const due = step.dueDate ? new Date(step.dueDate) : null;
              const overdue = due && due.getTime() < Date.now();
              const segment = step.entityType === "client" ? "clients" : "companies";
              const detailPath = `/dashboard/crm/${segment}/${step.entityId}/internal/workflows/${step.workflowId}`;

              return (
                <li key={step.id}>
                  <Link
                    href={detailPath}
                    className="-mx-2 flex flex-col justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="truncate font-medium text-sm transition-colors group-hover:text-primary">
                          {step.name}
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-neutral-400 opacity-0 transition-all group-hover:text-primary group-hover:opacity-100" />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs">
                        <span className="flex items-center gap-1">
                          <Workflow className="h-3 w-3" />
                          {step.workflowName}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          {step.entityType === "client" ? (
                            <User className="h-3 w-3" />
                          ) : (
                            <Building2 className="h-3 w-3" />
                          )}
                          {step.entityName}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="gap-1 bg-white px-2 py-0.5 font-normal text-[11px] dark:bg-zinc-950"
                      >
                        <User className="h-3 w-3" />
                        {step.responsibility === "advisor" ? "Advisor" : "Client"}
                      </Badge>

                      {step.priority && step.priority !== "None" && (
                        <Badge
                          className={cn("px-2 py-0.5 font-normal text-[11px]", PRIORITY_BADGE_CLASSES[step.priority])}
                        >
                          {step.priority}
                        </Badge>
                      )}

                      {due ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1 bg-white px-2 py-0.5 font-normal text-[11px] dark:bg-zinc-950",
                            overdue &&
                              "border-red-300 bg-red-50/30 text-red-600 dark:border-red-900 dark:bg-red-950/10 dark:text-red-400",
                          )}
                        >
                          {overdue ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                          {format(due, "MMM d, yyyy")}
                          {overdue && " (overdue)"}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-white px-2 py-0.5 font-normal text-[11px] text-muted-foreground dark:bg-zinc-950"
                        >
                          No due date
                        </Badge>
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
