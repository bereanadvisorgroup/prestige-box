"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { CheckCircle2, ChevronRight, Plus, Trash2, Workflow as WorkflowIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteWorkflow } from "@/actions/workflows";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type WorkflowEntityType, type WorkflowInstance, workflowPercentComplete } from "@/types/workflows";

import { CreateWorkflowDialog } from "./create-workflow-dialog";

type StatusFilter = "open" | "completed" | "all";

interface WorkflowListProps {
  entityType: WorkflowEntityType;
  entityId: string;
  workflows: WorkflowInstance[];
}

export function WorkflowList({ entityType, entityId, workflows }: WorkflowListProps) {
  const [filter, setFilter] = useState<StatusFilter>("open");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowInstance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const basePath = `/dashboard/crm/${entityType === "client" ? "clients" : "companies"}/${entityId}/internal/workflows`;

  const filtered = useMemo(() => {
    if (filter === "open") return workflows.filter((w) => !w.completedAt);
    if (filter === "completed") return workflows.filter((w) => w.completedAt);
    return workflows;
  }, [workflows, filter]);

  const handleDelete = async () => {
    if (!workflowToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteWorkflow(workflowToDelete.id);
      if (result.success) {
        toast.success("Workflow deleted");
        setWorkflowToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete workflow");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="font-bold text-3xl tracking-tight">Workflows</h1>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={filter}
            onValueChange={(value) => value && setFilter(value as StatusFilter)}
          >
            <ToggleGroupItem value="open">Open</ToggleGroupItem>
            <ToggleGroupItem value="completed">Completed</ToggleGroupItem>
            <ToggleGroupItem value="all">All</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shrink-0 font-semibold shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <WorkflowIcon className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">
              {filter === "completed"
                ? "No completed workflows yet."
                : filter === "open"
                  ? "No open workflows. Create one to get started."
                  : "No workflows yet. Create one to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((workflow) => {
            const percent = workflow.percentComplete ?? workflowPercentComplete(workflow.steps);
            const doneSteps = workflow.steps.filter((s) => s.completedAt).length;

            return (
              <Card key={workflow.id} className="transition-all hover:border-primary/45 hover:shadow-sm">
                <CardContent className="flex items-center gap-4 py-4">
                  <Link href={`${basePath}/${workflow.id}`} className="flex min-w-0 flex-1 items-center gap-4">
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
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive/80"
                    onClick={() => setWorkflowToDelete(workflow)}
                    aria-label={`Delete ${workflow.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Link href={`${basePath}/${workflow.id}`} className="shrink-0 text-muted-foreground">
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateWorkflowDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        entityType={entityType}
        entityId={entityId}
      />

      <AlertDialog open={!!workflowToDelete} onOpenChange={(open) => !open && setWorkflowToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the workflow{" "}
              <span className="font-semibold text-foreground">{workflowToDelete?.name}</span> and all of its step
              progress. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Workflow"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
