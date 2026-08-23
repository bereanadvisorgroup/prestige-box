import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

export const WORKFLOW_DUE_DATE_BASES = ["workflow_start", "after_last_step"] as const;
export type WorkflowDueDateBase = (typeof WORKFLOW_DUE_DATE_BASES)[number];

export const WORKFLOW_DUE_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export const WORKFLOW_PRIORITIES = ["None", "Low", "Medium", "High"] as const;
export type WorkflowPriority = (typeof WORKFLOW_PRIORITIES)[number];

export const WORKFLOW_RESPONSIBILITIES = ["advisor", "client", "client_company"] as const;
export type WorkflowResponsibility = string;

export const WORKFLOW_ENTITY_TYPES = ["client", "company"] as const;
export type WorkflowEntityType = (typeof WORKFLOW_ENTITY_TYPES)[number];

export const DUE_DATE_BASE_LABELS: Record<WorkflowDueDateBase, string> = {
  workflow_start: "Workflow Start Date",
  after_last_step: "After last step completed",
};

/**
 * Format workflow step responsibility string into a human-readable label.
 */
export function formatResponsibilityLabel(responsibility: string, teams?: Array<{ id: string; name: string }>): string {
  if (
    !responsibility ||
    responsibility === "client" ||
    responsibility === "client_company" ||
    responsibility === "advisor"
  ) {
    return "Client / Company";
  }
  if (teams && teams.length > 0) {
    const match = teams.find((t) => t.id === responsibility);
    if (match) return match.name;
  }
  return "Client / Company";
}

// ---------------------------------------------------------------------------
// Attachments (uploaded to Supabase Storage; metadata stored as JSONB)
// ---------------------------------------------------------------------------

export const WorkflowAttachmentSchema = z.object({
  id: z.string(),
  fileUrl: z.string(),
  fileName: z.string(),
  fileSize: z.number().optional().nullable(),
  mimeType: z.string().optional().nullable(),
});

export type WorkflowAttachment = z.infer<typeof WorkflowAttachmentSchema>;

// ---------------------------------------------------------------------------
// Outcomes (outcomes of a workflow step leading to a next step)
// ---------------------------------------------------------------------------

export const WorkflowOutcomeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Outcome name is required"),
  nextStepId: z.string().optional().nullable(),
  triggerWorkflowTemplateId: z.string().optional().nullable(),
});

export type WorkflowOutcome = z.infer<typeof WorkflowOutcomeSchema>;

// ---------------------------------------------------------------------------
// Template step
// ---------------------------------------------------------------------------

export const WorkflowTemplateStepSchema = z.object({
  id: z.string().optional(),
  templateId: z.string().optional(),
  name: z.string().min(1, "Step name is required"),
  sortOrder: z.number().int().default(0),
  setDueDate: z.boolean().default(false),
  dueDays: z.number().int().min(1).max(7).optional().nullable(),
  dueDateBase: z.enum(WORKFLOW_DUE_DATE_BASES).optional().nullable(),
  priority: z.enum(WORKFLOW_PRIORITIES).default("None"),
  description: z.string().optional().nullable(),
  responsibility: z.string().min(1).default("client_company"),
  attachments: z.array(WorkflowAttachmentSchema).default([]),
  outcomes: z.array(WorkflowOutcomeSchema).default([]),
  positionX: z.number().optional().nullable().default(0),
  positionY: z.number().optional().nullable().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type WorkflowTemplateStep = z.infer<typeof WorkflowTemplateStepSchema>;

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export const WorkflowTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  steps: z.array(WorkflowTemplateStepSchema).min(1, "Add at least one step"),
  graph: z.any().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type WorkflowTemplate = z.infer<typeof WorkflowTemplateSchema>;

/** Template list row (steps not loaded, only counted). */
export interface WorkflowTemplateListItem {
  id: string;
  name: string;
  description: string | null;
  stepCount: number;
  isLinked?: boolean;
  createdAt: string;
  updatedAt: string | null;
}

// ---------------------------------------------------------------------------
// Instance step (snapshot of a template step + completion tracking)
// ---------------------------------------------------------------------------

export interface WorkflowInstanceStep {
  id: string;
  instanceId: string;
  name: string;
  sortOrder: number;
  setDueDate: boolean;
  dueDays: number | null;
  dueDateBase: WorkflowDueDateBase | null;
  priority: WorkflowPriority;
  description: string | null;
  responsibility: WorkflowResponsibility;
  attachments: WorkflowAttachment[];
  dueDate: string | null;
  completedAt: string | null;
  completedBy: string | null;
  templateStepId: string | null;
  outcomes: WorkflowOutcome[];
  selectedOutcome: WorkflowOutcome | null;
  createdAt: string;
  updatedAt: string | null;
}

// ---------------------------------------------------------------------------
// Instance (a workflow assigned to a client or company)
// ---------------------------------------------------------------------------

export interface WorkflowInstance {
  id: string;
  templateId: string | null;
  name: string;
  description: string | null;
  entityType: WorkflowEntityType;
  entityId: string;
  startDate: string;
  createdBy: string | null;
  createdByName?: string | null;
  entityName?: string | null;
  completedAt: string | null;
  completedBy: string | null;
  percentComplete?: number;
  createdAt: string;
  updatedAt: string | null;
  steps: WorkflowInstanceStep[];
}

/** Percentage (0-100) of completed steps in a workflow instance. */
export function workflowPercentComplete(steps: Pick<WorkflowInstanceStep, "completedAt">[]): number {
  if (steps.length === 0) return 0;
  const done = steps.filter((s) => s.completedAt).length;
  return Math.round((done / steps.length) * 100);
}
