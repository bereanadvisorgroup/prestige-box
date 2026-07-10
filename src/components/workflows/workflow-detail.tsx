"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Calendar, CheckCircle2, Circle, Loader2, Paperclip, RotateCcw, Trophy } from "lucide-react";
import { toast } from "sonner";

import { completeWorkflow, reopenWorkflow, setWorkflowStepCompletion } from "@/actions/workflows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { sanitizeNoteHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import {
  type WorkflowEntityType,
  type WorkflowInstance,
  type WorkflowInstanceStep,
  workflowPercentComplete,
} from "@/types/workflows";

const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  High: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

interface WorkflowDetailProps {
  entityType: WorkflowEntityType;
  entityId: string;
  workflow: WorkflowInstance;
}

export function WorkflowDetail({ entityType, entityId, workflow }: WorkflowDetailProps) {
  const router = useRouter();
  const [pendingStepId, setPendingStepId] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const basePath = `/dashboard/crm/${entityType === "client" ? "clients" : "companies"}/${entityId}/internal/workflows`;

  const percent = workflowPercentComplete(workflow.steps);
  const allStepsDone = workflow.steps.length > 0 && workflow.steps.every((s) => s.completedAt);
  const isCompleted = !!workflow.completedAt;

  const handleToggleStep = async (step: WorkflowInstanceStep, completed: boolean) => {
    if (pendingStepId) return;

    setPendingStepId(step.id);
    try {
      const result = await setWorkflowStepCompletion(step.id, completed);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update step");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setPendingStepId(null);
    }
  };

  const handleCompleteWorkflow = async () => {
    setIsCompleting(true);
    try {
      const result = isCompleted ? await reopenWorkflow(workflow.id) : await completeWorkflow(workflow.id);
      if (result.success) {
        toast.success(isCompleted ? "Workflow reopened" : "Workflow completed 🎉");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update workflow");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href={basePath}
        className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Workflows
      </Link>

      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-bold text-3xl tracking-tight">{workflow.name}</h1>
            {isCompleted && (
              <Badge className="gap-1 border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Started {new Date(workflow.startDate).toLocaleDateString()}
            {workflow.createdByName ? ` by ${workflow.createdByName}` : ""}
            {workflow.completedAt ? ` · Completed ${new Date(workflow.completedAt).toLocaleDateString()}` : ""}
          </p>
        </div>
        <Button
          onClick={handleCompleteWorkflow}
          disabled={isCompleting || (!isCompleted && !allStepsDone)}
          variant={isCompleted ? "outline" : "default"}
          className="shrink-0 font-semibold shadow-sm"
          title={!isCompleted && !allStepsDone ? "Complete all steps first" : undefined}
        >
          {isCompleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isCompleted ? (
            <RotateCcw className="mr-2 h-4 w-4" />
          ) : (
            <Trophy className="mr-2 h-4 w-4" />
          )}
          {isCompleted ? "Reopen Workflow" : "Mark Complete"}
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center gap-4">
            <Progress value={percent} className="h-3" />
            <span className="shrink-0 font-semibold text-sm tabular-nums">{percent}%</span>
          </div>
          <p className="text-muted-foreground text-xs">
            {workflow.steps.filter((s) => s.completedAt).length} of {workflow.steps.length} steps completed
          </p>
          {workflow.description && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none border-t pt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized Tiptap HTML
              dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(workflow.description) }}
            />
          )}
        </CardContent>
      </Card>

      <div>
        {workflow.steps.map((step, index) => {
          const isDone = !!step.completedAt;
          const isPending = pendingStepId === step.id;
          const isOverdue = !isDone && step.dueDate && new Date(step.dueDate) < new Date();
          const isLast = index === workflow.steps.length - 1;

          return (
            <div key={step.id} className="flex gap-4">
              {/* Graphical rail: status circle + connector line */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-semibold text-sm transition-colors",
                    isDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-muted-foreground/30 bg-background text-muted-foreground",
                  )}
                >
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                </div>
                {!isLast && (
                  <div className={cn("w-0.5 flex-1", isDone ? "bg-emerald-500" : "bg-muted-foreground/20")} />
                )}
              </div>

              <Card className={cn("mb-4 flex-1", isDone && "bg-muted/40")}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("font-semibold", isDone && "text-muted-foreground line-through")}>
                      {step.name}
                    </span>
                    {step.priority !== "None" && (
                      <Badge className={cn("border-0", PRIORITY_BADGE_CLASSES[step.priority])}>{step.priority}</Badge>
                    )}
                    <Badge variant="outline">{step.responsibility === "advisor" ? "Advisor" : "Client"}</Badge>
                    {step.dueDate && (
                      <Badge
                        variant="outline"
                        className={cn("gap-1", isOverdue && "border-red-300 text-red-600 dark:text-red-400")}
                      >
                        <Calendar className="h-3 w-3" />
                        Due {new Date(step.dueDate).toLocaleDateString()}
                        {isOverdue ? " (overdue)" : ""}
                      </Badge>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <label
                          htmlFor={`step-complete-${step.id}`}
                          className="flex cursor-pointer items-center gap-2 text-muted-foreground text-sm"
                        >
                          <Checkbox
                            id={`step-complete-${step.id}`}
                            checked={isDone}
                            disabled={!!pendingStepId}
                            onCheckedChange={(checked) => handleToggleStep(step, checked === true)}
                            aria-label={`Mark step ${step.name} ${isDone ? "incomplete" : "complete"}`}
                          />
                          {isDone ? "Completed" : "Mark complete"}
                        </label>
                      )}
                    </div>
                  </div>

                  {isDone && step.completedAt && (
                    <p className="text-muted-foreground text-xs">
                      Completed {new Date(step.completedAt).toLocaleDateString()}
                    </p>
                  )}

                  {step.description && (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized Tiptap HTML
                      dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(step.description) }}
                    />
                  )}

                  {(step.attachments ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {step.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs transition-colors hover:bg-muted"
                        >
                          <Paperclip className="h-3 w-3" />
                          {attachment.fileName}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}

        {workflow.steps.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Circle className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">This workflow has no steps.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
