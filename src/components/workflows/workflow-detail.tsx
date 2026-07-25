"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Folder,
  HardDrive,
  Loader2,
  Paperclip,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  completeWorkflow,
  completeWorkflowStep,
  getEntityDocumentUrl,
  reopenWorkflow,
  reopenWorkflowStep,
  updateWorkflowDescription,
} from "@/actions/workflows";
import { GoogleDrivePickerDialog } from "@/components/tasks/gdrive-picker-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { sanitizeNoteHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import {
  formatResponsibilityLabel,
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
  teams?: Array<{ id: string; name: string }>;
}

interface DriveAttachment {
  id: string;
  name: string;
  url: string;
  isFolder: boolean;
}

function parseDriveAttachmentsFromDescription(rawDescription: string | null | undefined): {
  cleanDescription: string;
  attachments: DriveAttachment[];
} {
  if (!rawDescription?.trim()) {
    return { cleanDescription: "", attachments: [] };
  }

  const sectionIdx = rawDescription.indexOf('<div class="gdrive-attachments-section');
  if (sectionIdx !== -1) {
    const cleanDescription = rawDescription.slice(0, sectionIdx).trim();
    const sectionHtml = rawDescription.slice(sectionIdx);

    const attachments: DriveAttachment[] = [];
    const linkRegex = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let match = linkRegex.exec(sectionHtml);
    while (match !== null) {
      const url = match[1];
      const rawText = match[2].trim();
      const isFolder = rawText.includes("📁") || url.includes("/folders/");
      const name = rawText
        .replace(/^[📁📄]\s*/u, "")
        .replace(/\s*\(Google Drive\)$/, "")
        .trim();
      attachments.push({
        id: crypto.randomUUID(),
        name: name || "Google Drive Item",
        url,
        isFolder,
      });
      match = linkRegex.exec(sectionHtml);
    }
    return { cleanDescription, attachments };
  }

  return { cleanDescription: rawDescription, attachments: [] };
}

function buildDescriptionPayload(cleanDescription: string, attachments: DriveAttachment[]): string {
  const baseDesc = cleanDescription ? cleanDescription.trim() : "";
  if (!attachments || attachments.length === 0) {
    return baseDesc;
  }

  const listItemsHtml = attachments
    .map(
      (a) =>
        `<li data-gdrive-id="${a.id}" data-gdrive-folder="${a.isFolder}"><a href="${a.url}" target="_blank" rel="noreferrer" class="gdrive-link">${
          a.isFolder ? "📁" : "📄"
        } ${a.name} (Google Drive)</a></li>`,
    )
    .join("");

  const sectionHtml = `<div class="gdrive-attachments-section mt-4 pt-3 border-t"><p class="font-semibold text-sm mb-2">Linked Google Drive Files:</p><ul>${listItemsHtml}</ul></div>`;

  return baseDesc ? `${baseDesc}<br/>${sectionHtml}` : sectionHtml;
}

export function WorkflowDetail({ entityType, entityId, workflow, teams }: WorkflowDetailProps) {
  const router = useRouter();
  const [pendingStepId, setPendingStepId] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Google Drive state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [entityDocInfo, setEntityDocInfo] = useState<{ name: string; documentUrl: string | null } | null>(null);
  const [driveAttachments, setDriveAttachments] = useState<DriveAttachment[]>([]);
  const [isUpdatingAttachments, setIsUpdatingAttachments] = useState(false);

  const basePath = `/dashboard/crm/${entityType === "client" ? "clients" : "companies"}/${entityId}/internal/workflows`;

  const percent = workflow.percentComplete ?? workflowPercentComplete(workflow.steps);
  const allStepsDone = workflow.steps.length > 0 && workflow.steps.every((s) => s.completedAt);
  const isCompleted = !!workflow.completedAt;

  useEffect(() => {
    let cancelled = false;
    getEntityDocumentUrl(entityType, entityId).then((res) => {
      if (!cancelled && res.success) {
        setEntityDocInfo({
          name: res.name || "Entity",
          documentUrl: res.documentUrl || null,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  useEffect(() => {
    const { attachments } = parseDriveAttachmentsFromDescription(workflow.description);
    setDriveAttachments(attachments);
  }, [workflow.description]);

  const handleDriveSelect = async (item: { name: string; url: string; isFolder: boolean }) => {
    const newAttachment: DriveAttachment = {
      id: crypto.randomUUID(),
      name: item.name,
      url: item.url,
      isFolder: item.isFolder,
    };
    const updated = [...driveAttachments, newAttachment];
    setDriveAttachments(updated);

    const { cleanDescription } = parseDriveAttachmentsFromDescription(workflow.description);
    const newPayload = buildDescriptionPayload(cleanDescription, updated);

    setIsUpdatingAttachments(true);
    try {
      const res = await updateWorkflowDescription(workflow.id, newPayload);
      if (res.success) {
        toast.success(`Linked Google Drive ${item.isFolder ? "folder" : "file"}`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save link");
      }
    } catch (_err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdatingAttachments(false);
    }
  };

  const removeDriveAttachment = async (id: string) => {
    const updated = driveAttachments.filter((a) => a.id !== id);
    setDriveAttachments(updated);

    const { cleanDescription } = parseDriveAttachmentsFromDescription(workflow.description);
    const newPayload = buildDescriptionPayload(cleanDescription, updated);

    setIsUpdatingAttachments(true);
    try {
      const res = await updateWorkflowDescription(workflow.id, newPayload);
      if (res.success) {
        toast.success("Link removed");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to remove link");
      }
    } catch (_err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdatingAttachments(false);
    }
  };

  const handleToggleStep = async (step: WorkflowInstanceStep, completed: boolean) => {
    if (pendingStepId) return;

    setPendingStepId(step.id);
    try {
      const result = completed ? await completeWorkflowStep(step.id) : await reopenWorkflowStep(step.id);

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

  const handleCompleteStep = async (step: WorkflowInstanceStep, outcomeId: string) => {
    if (pendingStepId) return;

    setPendingStepId(step.id);
    try {
      const result = await completeWorkflowStep(step.id, outcomeId);
      if (result.success) {
        toast.success("Step completed");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to complete step");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setPendingStepId(null);
    }
  };

  const handleReopenStep = async (step: WorkflowInstanceStep) => {
    if (pendingStepId) return;

    setPendingStepId(step.id);
    try {
      const result = await reopenWorkflowStep(step.id);
      if (result.success) {
        toast.success("Step reopened. Subsequent steps removed.");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to reopen step");
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
            {workflow.steps.filter((s) => s.completedAt).length} steps completed
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

      {/* Linked Google Drive Files Section (just before the list of steps) */}
      {(entityDocInfo?.documentUrl || driveAttachments.length > 0) && (
        <Card className="border-emerald-200/60 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10">
          <CardContent className="space-y-3 py-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-foreground text-sm">
                <HardDrive className="h-4 w-4 text-emerald-600" />
                Linked Google Drive Files ({driveAttachments.length})
              </span>
              {entityDocInfo?.documentUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                  disabled={isUpdatingAttachments}
                  className="h-7 gap-1.5 border-emerald-300 text-emerald-700 text-xs hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                >
                  <HardDrive className="h-3.5 w-3.5 text-emerald-600" />
                  Link File
                </Button>
              )}
            </div>

            {driveAttachments.length === 0 ? (
              <p className="text-muted-foreground text-xs italic">
                No files linked yet. Click "Link File" to attach Google Drive documents or folders to this workflow.
              </p>
            ) : (
              <div className="space-y-2">
                {driveAttachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    {a.isFolder ? (
                      <Folder className="h-4 w-4 shrink-0 text-amber-500" />
                    ) : (
                      <HardDrive className="h-4 w-4 shrink-0 text-emerald-600" />
                    )}
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 truncate font-medium hover:underline"
                    >
                      {a.name}
                    </a>
                    <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Google Drive
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeDriveAttachment(a.id)}
                      disabled={isUpdatingAttachments}
                      title="Remove link"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {entityDocInfo?.documentUrl && (
        <GoogleDrivePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          entityName={entityDocInfo.name}
          documentUrl={entityDocInfo.documentUrl}
          onSelect={handleDriveSelect}
        />
      )}

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
                    <Badge variant="outline">{formatResponsibilityLabel(step.responsibility, teams)}</Badge>
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
                      ) : isDone ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <span>Completed {step.selectedOutcome ? `(${step.selectedOutcome.name})` : ""}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleReopenStep(step)}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" /> Reopen
                          </Button>
                        </div>
                      ) : (step.outcomes || []).length <= 1 ? (
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
                      ) : (
                        <span className="font-semibold text-amber-600 text-xs dark:text-amber-400">
                          Awaiting outcome selection...
                        </span>
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

                  {!isDone && (step.outcomes || []).length > 1 && (
                    <div className="space-y-2 border-t pt-3">
                      <p className="font-semibold text-muted-foreground text-xs">Select outcome to complete step:</p>
                      <div className="flex flex-wrap gap-2">
                        {step.outcomes.map((outcome) => (
                          <Button
                            key={outcome.id}
                            size="sm"
                            variant="outline"
                            className="border-primary/40 font-semibold text-primary text-xs shadow-sm transition-all hover:scale-[1.02] hover:bg-primary hover:text-primary-foreground active:scale-95"
                            onClick={() => handleCompleteStep(step, outcome.id)}
                            disabled={!!pendingStepId}
                          >
                            {outcome.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(step.attachments ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2 border-t pt-3">
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
