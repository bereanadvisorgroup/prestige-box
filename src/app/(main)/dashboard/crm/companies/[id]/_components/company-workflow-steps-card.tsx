import Link from "next/link";

import { ArrowUpRight, Calendar, Clock, User, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatResponsibilityLabel, type WorkflowInstanceStep } from "@/types/workflows";

interface OutstandingStep extends WorkflowInstanceStep {
  workflowName: string;
  workflowId: string;
}

interface CompanyWorkflowStepsCardProps {
  companyId: string;
  steps: OutstandingStep[];
  teams?: Array<{ id: string; name: string }>;
}

const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-none",
  High: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-none",
  None: "bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 border-none",
};

export function CompanyWorkflowStepsCard({ companyId, steps, teams }: CompanyWorkflowStepsCardProps) {
  const basePath = `/dashboard/crm/companies/${companyId}/internal/workflows`;

  return (
    <Card className="flex h-full min-h-[220px] flex-col border-none shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between font-medium text-2xl text-neutral-800 tracking-tight dark:text-neutral-200">
          <span>Workflow Steps:</span>
          {steps.length > 0 && (
            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 font-semibold text-xs">
              {steps.length} outstanding
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between">
        <div className="scrollbar-thin mb-2 max-h-[280px] flex-1 space-y-3 overflow-y-auto pr-1">
          {steps.length > 0 ? (
            steps.map((step) => {
              const isOverdue = step.dueDate ? new Date(step.dueDate).getTime() < Date.now() : false;

              return (
                <Link
                  key={step.id}
                  href={`${basePath}/${step.workflowId}`}
                  className="group flex cursor-pointer flex-col justify-between gap-3 rounded-lg border-neutral-100 border-b p-2 pb-3 transition-colors last:border-0 last:pb-0 hover:bg-neutral-50 sm:flex-row sm:items-center dark:border-zinc-800 dark:hover:bg-zinc-850"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="break-words font-semibold text-neutral-850 text-sm leading-tight transition-colors group-hover:text-primary dark:text-neutral-200">
                        {step.name}
                      </span>
                      <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400 opacity-0 transition-all group-hover:text-primary group-hover:opacity-100" />
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <Workflow className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                      <span className="truncate">{step.workflowName}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {/* Responsibility Badge */}
                    <Badge
                      variant="outline"
                      className="gap-1 bg-white px-2 py-0.5 font-normal text-xs dark:bg-zinc-950"
                    >
                      <User className="h-3 w-3" />
                      {formatResponsibilityLabel(step.responsibility, teams)}
                    </Badge>

                    {/* Priority Badge */}
                    {step.priority && step.priority !== "None" && (
                      <Badge className={cn("px-2 py-0.5 font-normal text-xs", PRIORITY_BADGE_CLASSES[step.priority])}>
                        {step.priority}
                      </Badge>
                    )}

                    {/* Due Date Badge */}
                    {step.dueDate ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 bg-white px-2 py-0.5 font-normal text-xs dark:bg-zinc-950",
                          isOverdue &&
                            "border-red-300 bg-red-50/30 text-red-600 dark:border-red-900 dark:bg-red-950/10 dark:text-red-400",
                        )}
                      >
                        {isOverdue ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                        {new Date(step.dueDate).toLocaleDateString()}
                        {isOverdue && " (overdue)"}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-white px-2 py-0.5 font-normal text-muted-foreground text-xs dark:bg-zinc-950"
                      >
                        No due date
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 py-8 text-center">
              <Workflow className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm italic">No outstanding workflow steps.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
