"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Building2, CheckCircle2, ChevronRight, Search, User, Workflow as WorkflowIcon, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type WorkflowInstance, workflowPercentComplete } from "@/types/workflows";

type StatusFilter = "open" | "completed" | "all";
type TypeFilter = "all" | "client" | "company";

interface AllWorkflowsListProps {
  workflows: WorkflowInstance[];
}

export function AllWorkflowsList({ workflows }: AllWorkflowsListProps) {
  const [status, setStatus] = useState<StatusFilter>("open");
  const [type, setType] = useState<TypeFilter>("all");
  const [searchValue, setSearchValue] = useState("");

  const filtered = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return workflows.filter((w) => {
      if (status === "open" && w.completedAt) return false;
      if (status === "completed" && !w.completedAt) return false;
      if (type !== "all" && w.entityType !== type) return false;
      if (query) {
        const haystack = `${w.name} ${w.entityName ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [workflows, status, type, searchValue]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <h1 className="font-bold text-3xl tracking-tight">Workflows</h1>
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={status}
            onValueChange={(value) => value && setStatus(value as StatusFilter)}
          >
            <ToggleGroupItem value="open">Open</ToggleGroupItem>
            <ToggleGroupItem value="completed">Completed</ToggleGroupItem>
            <ToggleGroupItem value="all">All</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={type}
            onValueChange={(value) => value && setType(value as TypeFilter)}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="client">Clients</ToggleGroupItem>
            <ToggleGroupItem value="company">Companies</ToggleGroupItem>
          </ToggleGroup>
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client or company name..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="bg-background pr-9 pl-9"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue("")}
                className="absolute top-2.5 right-3 flex h-4 w-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <WorkflowIcon className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">No workflows match the current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((workflow) => {
            const percent = workflowPercentComplete(workflow.steps);
            const doneSteps = workflow.steps.filter((s) => s.completedAt).length;
            const segment = workflow.entityType === "client" ? "clients" : "companies";
            const detailPath = `/dashboard/crm/${segment}/${workflow.entityId}/internal/workflows/${workflow.id}`;

            return (
              <Card key={workflow.id} className="transition-all hover:border-primary/45 hover:shadow-sm">
                <CardContent className="flex items-center gap-4 py-4">
                  <Link href={detailPath} className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold">{workflow.name}</span>
                        {workflow.completedAt ? (
                          <Badge className="gap-1 border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Open</Badge>
                        )}
                        <Badge variant="outline" className="gap-1">
                          {workflow.entityType === "client" ? (
                            <User className="h-3 w-3" />
                          ) : (
                            <Building2 className="h-3 w-3" />
                          )}
                          {workflow.entityName ?? (workflow.entityType === "client" ? "Client" : "Company")}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
                        <span>
                          Created {new Date(workflow.createdAt).toLocaleDateString()}
                          {workflow.createdByName ? ` by ${workflow.createdByName}` : ""}
                        </span>
                        {workflow.completedAt && (
                          <span>Completed {new Date(workflow.completedAt).toLocaleDateString()}</span>
                        )}
                        <span>
                          {doneSteps}/{workflow.steps.length} steps
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={percent} className="h-2 max-w-64" />
                        <span className="font-medium text-muted-foreground text-xs tabular-nums">{percent}%</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
