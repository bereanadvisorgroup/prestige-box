"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer, verifyStaff } from "@/lib/supabase.server";
import { formatFullName } from "@/lib/utils";
import type {
  WorkflowDueDateBase,
  WorkflowEntityType,
  WorkflowInstance,
  WorkflowInstanceStep,
} from "@/types/workflows";

const INSTANCES_TABLE = "workflow_instances";
const INSTANCE_STEPS_TABLE = "workflow_instance_steps";
const TEMPLATE_STEPS_TABLE = "workflow_template_steps";

function entityWorkflowsPath(entityType: WorkflowEntityType, entityId: string) {
  const segment = entityType === "client" ? "clients" : "companies";
  return `/dashboard/crm/${segment}/${entityId}/internal/workflows`;
}

function revalidateWorkflowPaths(entityType: WorkflowEntityType, entityId: string, workflowId?: string) {
  const base = entityWorkflowsPath(entityType, entityId);
  revalidatePath(base);
  if (workflowId) revalidatePath(`${base}/${workflowId}`);
  revalidatePath("/dashboard/crm/workflows");
}

function addDays(base: Date, days: number) {
  const result = new Date(base);
  result.setDate(result.getDate() + days);
  return result.toISOString();
}

type ProjectableStep = {
  setDueDate: boolean;
  dueDays: number | null;
  dueDateBase: WorkflowDueDateBase | null;
  completedAt: string | null;
};

/**
 * Project a due date for every step by cascading each step's `dueDays` forward.
 *
 * Steps are walked in order maintaining a running "anchor" date. A step based
 * on the workflow start always resolves relative to `startDate`; every other
 * step resolves relative to the anchor — the previous step's actual completion
 * date if it's completed, otherwise the previous step's own projected due date.
 * This gives a full projected timeline at creation and re-anchors downstream
 * steps to reality as earlier steps are completed (or un-completed).
 *
 * Returns one due date (ISO string or null) per step, in the given order.
 */
function projectStepDueDates(startDate: Date, steps: ProjectableStep[]): (string | null)[] {
  let anchor = startDate;
  return steps.map((step) => {
    let dueDate: string | null = null;
    if (step.setDueDate && step.dueDays) {
      const base = step.dueDateBase === "workflow_start" ? startDate : anchor;
      dueDate = addDays(base, step.dueDays);
    }

    // Advance the anchor for the next step: prefer this step's actual
    // completion, fall back to its projected due date, otherwise keep the
    // previous anchor (a step with no due date doesn't move the timeline).
    if (step.completedAt) {
      anchor = new Date(step.completedAt);
    } else if (dueDate) {
      anchor = new Date(dueDate);
    }

    return dueDate;
  });
}

/**
 * Recompute and persist projected due dates for every incomplete step of an
 * instance. Completed steps keep their recorded due date but still anchor the
 * steps that follow them. Safe to call after any completion change.
 */
async function _recomputeInstanceDueDates(instanceId: string, now: Date) {
  const { data: instance } = await supabaseServer
    .from(INSTANCES_TABLE)
    .select("startDate")
    .eq("id", instanceId)
    .single();

  if (!instance) return;

  const { data: steps } = await supabaseServer
    .from(INSTANCE_STEPS_TABLE)
    .select("id, sortOrder, setDueDate, dueDays, dueDateBase, completedAt, dueDate")
    .eq("instanceId", instanceId)
    .order("sortOrder", { ascending: true });

  if (!steps) return;

  const projected = projectStepDueDates(new Date(instance.startDate), steps);

  const toMs = (value: string | null) => (value ? new Date(value).getTime() : null);

  await Promise.all(
    steps.map((step, index) => {
      const dueDate = projected[index];
      // Leave completed steps' recorded due dates untouched; only update
      // incomplete steps whose projected date actually changed.
      if (step.completedAt || toMs(step.dueDate) === toMs(dueDate)) return null;
      return supabaseServer
        .from(INSTANCE_STEPS_TABLE)
        .update({ dueDate, updatedAt: now.toISOString() })
        .eq("id", step.id);
    }),
  );
}

/**
 * BFS algorithm to find shortest path distance to the "end" node.
 */
function getShortestPathToEnd(graph: any, startNodeId: string): number {
  if (!graph?.nodes || !graph.edges) return 0;
  const edges = graph.edges || [];
  const queue: [string, number][] = [[startNodeId, 0]];
  const visited = new Set<string>([startNodeId]);

  while (queue.length > 0) {
    const [currentId, dist] = queue.shift()!;
    if (currentId === "end") {
      return dist;
    }

    const outgoing = edges.filter((e: any) => e.source === currentId);
    for (const edge of outgoing) {
      const target = edge.target;
      if (!visited.has(target)) {
        visited.add(target);
        queue.push([target, dist + 1]);
      }
    }
  }

  return 0;
}

/**
 * Batch enrich workflow instances with calculated percentage complete.
 */
async function enrichWorkflowsWithProgress(instances: any[]) {
  if (instances.length === 0) return;

  const templateIds = [...new Set(instances.map((w) => w.templateId).filter(Boolean))] as string[];
  const templateGraphs = new Map<string, any>();

  if (templateIds.length > 0) {
    const { data: templates } = await supabaseServer
      .from("workflow_templates")
      .select("id, graph")
      .in("id", templateIds);

    for (const t of templates || []) {
      templateGraphs.set(t.id, t.graph);
    }
  }

  for (const w of instances) {
    let percentComplete = 0;
    if (w.completedAt) {
      percentComplete = 100;
    } else {
      const steps = (w.workflow_instance_steps || w.steps || []) as WorkflowInstanceStep[];
      const completedCount = steps.filter((s) => s.completedAt).length;

      // Find the current active step in the list (highest sortOrder that is not yet completed)
      const sortedSteps = [...steps].sort((a, b) => b.sortOrder - a.sortOrder);
      const activeStep = sortedSteps.find((s) => !s.completedAt);

      if (activeStep?.templateStepId && w.templateId) {
        const graph = templateGraphs.get(w.templateId);
        if (graph) {
          const dist = getShortestPathToEnd(graph, activeStep.templateStepId);
          const remainingCount = dist > 0 ? dist - 1 : 0;
          const totalEstimate = completedCount + remainingCount + 1;
          percentComplete = Math.round((completedCount / totalEstimate) * 100);
        }
      } else if (steps.length > 0 && steps.every((s) => s.completedAt)) {
        percentComplete = 100;
      }
    }
    w.percentComplete = percentComplete;
  }
}

/**
 * Create a new workflow for a client or company as a snapshot copy of a template.
 * Under the new design, only the first step is copied immediately.
 */
export async function createWorkflowFromTemplate(templateId: string, entityType: WorkflowEntityType, entityId: string) {
  try {
    const user = await verifyStaff();

    const { data: template, error: templateError } = await supabaseServer
      .from("workflow_templates")
      .select("*, workflow_template_steps(*)")
      .eq("id", templateId)
      .single();

    if (templateError || !template) throw new Error("Workflow template not found.");

    const graph = template.graph || { nodes: [], edges: [] };
    const templateSteps = template.workflow_template_steps || [];

    // Find the first step from graph
    let firstStep = null;
    const startEdge = (graph.edges || []).find((e: any) => e.source === "start");
    if (startEdge) {
      firstStep = templateSteps.find((s: any) => s.id === startEdge.target);
    }

    // Fallback if no startEdge or step not found
    if (!firstStep && templateSteps.length > 0) {
      firstStep = [...templateSteps].sort((a, b) => a.sortOrder - b.sortOrder)[0];
    }

    if (!firstStep) throw new Error("This workflow template has no steps.");

    const startDate = new Date();

    const { data: instance, error: instanceError } = await supabaseServer
      .from(INSTANCES_TABLE)
      .insert({
        templateId,
        name: template.name,
        description: template.description,
        entityType,
        entityId,
        startDate: startDate.toISOString(),
        createdBy: user.id,
      })
      .select()
      .single();

    if (instanceError) throw new Error((instanceError as { message: string }).message);

    let dueDate: string | null = null;
    if (firstStep.setDueDate && firstStep.dueDays) {
      dueDate = addDays(startDate, firstStep.dueDays);
    }

    const firstStepRow = {
      instanceId: instance.id,
      templateStepId: firstStep.id,
      name: firstStep.name,
      sortOrder: 0,
      setDueDate: firstStep.setDueDate,
      dueDays: firstStep.dueDays,
      dueDateBase: firstStep.dueDateBase,
      priority: firstStep.priority,
      description: firstStep.description,
      responsibility: firstStep.responsibility,
      attachments: firstStep.attachments ?? [],
      outcomes: firstStep.outcomes ?? [],
      selectedOutcome: null,
      dueDate,
    };

    const { error: insertStepError } = await supabaseServer.from(INSTANCE_STEPS_TABLE).insert(firstStepRow);
    if (insertStepError) throw new Error((insertStepError as { message: string }).message);

    revalidateWorkflowPaths(entityType, entityId);

    return { success: true, id: instance.id };
  } catch (error) {
    console.error("[createWorkflowFromTemplate] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch all workflows for a client or company, with steps for progress display.
 */
export async function getWorkflows(entityType: WorkflowEntityType, entityId: string | string[]) {
  try {
    let query = supabaseServer
      .from(INSTANCES_TABLE)
      .select("*, workflow_instance_steps(*)")
      .eq("entityType", entityType);

    if (Array.isArray(entityId)) {
      if (entityId.length === 0) return { success: true, workflows: [] as WorkflowInstance[] };
      query = query.in("entityId", entityId);
    } else {
      query = query.eq("entityId", entityId);
    }

    const { data: list, error } = await query.order("createdAt", { ascending: false });

    if (error) throw new Error((error as { message: string }).message);

    const creatorIds = [...new Set((list || []).map((w) => w.createdBy).filter(Boolean))] as string[];
    const creatorNames = new Map<string, string>();
    if (creatorIds.length > 0) {
      const { data: creators } = await supabaseServer
        .from("users")
        .select("uid, firstName, lastName")
        .in("uid", creatorIds);
      for (const u of creators || []) {
        creatorNames.set(u.uid, `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unknown");
      }
    }

    const workflows: WorkflowInstance[] = (list || []).map((w) => ({
      ...w,
      createdByName: w.createdBy ? (creatorNames.get(w.createdBy) ?? null) : null,
      steps: ((w.workflow_instance_steps || []) as WorkflowInstanceStep[]).sort((a, b) => a.sortOrder - b.sortOrder),
    }));

    await enrichWorkflowsWithProgress(workflows);

    return { success: true, workflows };
  } catch (error) {
    console.error("[getWorkflows] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch all workflows across every client and company, with steps for
 * progress display and entity names resolved for filtering.
 */
export async function getAllWorkflows() {
  try {
    const { data: list, error } = await supabaseServer
      .from(INSTANCES_TABLE)
      .select("*, workflow_instance_steps(*)")
      .order("createdAt", { ascending: false });

    if (error) throw new Error((error as { message: string }).message);

    const instances = list || [];

    const clientIds = [...new Set(instances.filter((w) => w.entityType === "client").map((w) => w.entityId))];
    const companyIds = [...new Set(instances.filter((w) => w.entityType === "company").map((w) => w.entityId))];
    const creatorIds = [...new Set(instances.map((w) => w.createdBy).filter(Boolean))] as string[];

    const entityNames = new Map<string, string>();
    const creatorNames = new Map<string, string>();

    const [clientRows, companyRows, creatorRows] = await Promise.all([
      clientIds.length > 0
        ? supabaseServer.from("clients").select("id, personId").in("id", clientIds)
        : Promise.resolve({ data: [] }),
      companyIds.length > 0
        ? supabaseServer.from("companies").select("id, name").in("id", companyIds)
        : Promise.resolve({ data: [] }),
      creatorIds.length > 0
        ? supabaseServer.from("users").select("uid, firstName, lastName").in("uid", creatorIds)
        : Promise.resolve({ data: [] }),
    ]);

    const personIds = [...new Set((clientRows.data || []).map((c) => c.personId).filter(Boolean))];
    const personNames = new Map<string, string>();
    if (personIds.length > 0) {
      const { data: persons } = await supabaseServer
        .from("people")
        .select("id, firstName, lastName, suffix, goesBy")
        .in("id", personIds);
      for (const p of persons || []) {
        personNames.set(p.id, formatFullName(p.firstName, p.lastName, p.suffix, "", p.goesBy));
      }
    }

    for (const c of clientRows.data || []) {
      entityNames.set(`client:${c.id}`, personNames.get(c.personId) || "Unnamed Client");
    }
    for (const c of companyRows.data || []) {
      entityNames.set(`company:${c.id}`, c.name || "Unnamed Company");
    }
    for (const u of creatorRows.data || []) {
      creatorNames.set(u.uid, `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unknown");
    }

    const workflows: WorkflowInstance[] = instances.map((w) => ({
      ...w,
      createdByName: w.createdBy ? (creatorNames.get(w.createdBy) ?? null) : null,
      entityName: entityNames.get(`${w.entityType}:${w.entityId}`) ?? null,
      steps: ((w.workflow_instance_steps || []) as WorkflowInstanceStep[]).sort((a, b) => a.sortOrder - b.sortOrder),
    }));

    await enrichWorkflowsWithProgress(workflows);

    return { success: true, workflows };
  } catch (error) {
    console.error("[getAllWorkflows] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch a single workflow with its ordered steps.
 */
export async function getWorkflow(id: string) {
  try {
    const { data: record, error } = await supabaseServer
      .from(INSTANCES_TABLE)
      .select("*, workflow_instance_steps(*)")
      .eq("id", id)
      .single();

    if (error) throw new Error((error as { message: string }).message);

    let createdByName: string | null = null;
    if (record.createdBy) {
      const { data: creator } = await supabaseServer
        .from("users")
        .select("firstName, lastName")
        .eq("uid", record.createdBy)
        .single();
      if (creator) createdByName = `${creator.firstName ?? ""} ${creator.lastName ?? ""}`.trim() || null;
    }

    const workflow: WorkflowInstance = {
      ...record,
      createdByName,
      steps: ((record.workflow_instance_steps || []) as WorkflowInstanceStep[]).sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    };

    await enrichWorkflowsWithProgress([workflow]);

    return { success: true, workflow };
  } catch (error) {
    console.error("[getWorkflow] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete a workflow instance (steps cascade).
 */
export async function deleteWorkflow(id: string) {
  try {
    await verifyStaff();

    const { data: record } = await supabaseServer
      .from(INSTANCES_TABLE)
      .select("entityType, entityId")
      .eq("id", id)
      .single();

    const { error } = await supabaseServer.from(INSTANCES_TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    if (record) revalidateWorkflowPaths(record.entityType, record.entityId);

    return { success: true };
  } catch (error) {
    console.error("[deleteWorkflow] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Complete a workflow step, select the outcome, and copy the next step from template.
 */
export async function completeWorkflowStep(stepId: string, outcomeId?: string) {
  try {
    const user = await verifyStaff();

    const { data: step, error: stepError } = await supabaseServer
      .from(INSTANCE_STEPS_TABLE)
      .select("*")
      .eq("id", stepId)
      .single();

    if (stepError || !step) throw new Error("Workflow step not found.");

    const now = new Date();
    let selectedOutcome = null;
    let nextStepId = null;

    if (outcomeId && step.outcomes) {
      const outcome = (step.outcomes as any[]).find((o) => o.id === outcomeId);
      if (outcome) {
        selectedOutcome = outcome;
        nextStepId = outcome.nextStepId;
      }
    } else if (step.outcomes && step.outcomes.length === 1) {
      // Auto-select if there is exactly 1 outcome
      selectedOutcome = step.outcomes[0];
      nextStepId = step.outcomes[0].nextStepId;
    }

    // Update current step to completed
    const { error: updateError } = await supabaseServer
      .from(INSTANCE_STEPS_TABLE)
      .update({
        completedAt: now.toISOString(),
        completedBy: user.id,
        selectedOutcome,
        updatedAt: now.toISOString(),
      })
      .eq("id", stepId);

    if (updateError) throw new Error((updateError as { message: string }).message);

    // If there is a next step, copy it
    if (nextStepId) {
      const { data: nextTemplateStep, error: nextStepError } = await supabaseServer
        .from(TEMPLATE_STEPS_TABLE)
        .select("*")
        .eq("id", nextStepId)
        .single();

      if (nextStepError || !nextTemplateStep) {
        console.error("Next template step not found:", nextStepId, nextStepError);
      } else {
        let dueDate: string | null = null;
        if (nextTemplateStep.setDueDate && nextTemplateStep.dueDays) {
          if (nextTemplateStep.dueDateBase === "workflow_start") {
            const { data: instance } = await supabaseServer
              .from(INSTANCES_TABLE)
              .select("startDate")
              .eq("id", step.instanceId)
              .single();
            if (instance?.startDate) {
              dueDate = addDays(new Date(instance.startDate), nextTemplateStep.dueDays);
            }
          } else {
            dueDate = addDays(now, nextTemplateStep.dueDays);
          }
        }

        const newStepRow = {
          instanceId: step.instanceId,
          templateStepId: nextTemplateStep.id,
          name: nextTemplateStep.name,
          sortOrder: step.sortOrder + 1,
          setDueDate: nextTemplateStep.setDueDate,
          dueDays: nextTemplateStep.dueDays,
          dueDateBase: nextTemplateStep.dueDateBase,
          priority: nextTemplateStep.priority,
          description: nextTemplateStep.description,
          responsibility: nextTemplateStep.responsibility,
          attachments: nextTemplateStep.attachments ?? [],
          outcomes: nextTemplateStep.outcomes ?? [],
          selectedOutcome: null,
          dueDate,
        };

        const { error: insertNextError } = await supabaseServer.from(INSTANCE_STEPS_TABLE).insert(newStepRow);

        if (insertNextError) throw new Error((insertNextError as { message: string }).message);
      }
    } else {
      // No next step (leads to End), mark workflow instance completed!
      await supabaseServer
        .from(INSTANCES_TABLE)
        .update({
          completedAt: now.toISOString(),
          completedBy: user.id,
          updatedAt: now.toISOString(),
        })
        .eq("id", step.instanceId);
    }

    const { data: instance } = await supabaseServer
      .from(INSTANCES_TABLE)
      .select("entityType, entityId")
      .eq("id", step.instanceId)
      .single();

    if (instance) revalidateWorkflowPaths(instance.entityType, instance.entityId, step.instanceId);

    return { success: true };
  } catch (error) {
    console.error("[completeWorkflowStep] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Reopen a completed workflow step and remove any subsequent steps that were copied.
 */
export async function reopenWorkflowStep(stepId: string) {
  try {
    const _user = await verifyStaff();

    const { data: step, error: stepError } = await supabaseServer
      .from(INSTANCE_STEPS_TABLE)
      .select("*")
      .eq("id", stepId)
      .single();

    if (stepError || !step) throw new Error("Workflow step not found.");

    const now = new Date();

    // Reopen the step by resetting completion fields
    const { error: updateError } = await supabaseServer
      .from(INSTANCE_STEPS_TABLE)
      .update({
        completedAt: null,
        completedBy: null,
        selectedOutcome: null,
        updatedAt: now.toISOString(),
      })
      .eq("id", stepId);

    if (updateError) throw new Error((updateError as { message: string }).message);

    // Delete all steps after this one in the sequence
    const { error: deleteError } = await supabaseServer
      .from(INSTANCE_STEPS_TABLE)
      .delete()
      .eq("instanceId", step.instanceId)
      .gt("sortOrder", step.sortOrder);

    if (deleteError) throw new Error((deleteError as { message: string }).message);

    // Reopen the workflow itself if it was completed
    await supabaseServer
      .from(INSTANCES_TABLE)
      .update({
        completedAt: null,
        completedBy: null,
        updatedAt: now.toISOString(),
      })
      .eq("id", step.instanceId);

    const { data: instance } = await supabaseServer
      .from(INSTANCES_TABLE)
      .select("entityType, entityId")
      .eq("id", step.instanceId)
      .single();

    if (instance) revalidateWorkflowPaths(instance.entityType, instance.entityId, step.instanceId);

    return { success: true };
  } catch (error) {
    console.error("[reopenWorkflowStep] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Compatibility wrapper mapping setWorkflowStepCompletion to new functions.
 */
export async function setWorkflowStepCompletion(stepId: string, completed: boolean) {
  if (completed) {
    return completeWorkflowStep(stepId);
  }
  return reopenWorkflowStep(stepId);
}

/**
 * Mark a whole workflow complete. All steps must be completed first.
 */
export async function completeWorkflow(id: string) {
  try {
    const user = await verifyStaff();

    const { data: steps, error: stepsError } = await supabaseServer
      .from(INSTANCE_STEPS_TABLE)
      .select("id, completedAt")
      .eq("instanceId", id);

    if (stepsError) throw new Error((stepsError as { message: string }).message);

    const incomplete = (steps || []).filter((s) => !s.completedAt).length;
    if (incomplete > 0) {
      throw new Error(`Cannot complete workflow: ${incomplete} step(s) remaining.`);
    }

    const now = new Date().toISOString();

    const { data: updated, error } = await supabaseServer
      .from(INSTANCES_TABLE)
      .update({ completedAt: now, completedBy: user.id, updatedAt: now })
      .eq("id", id)
      .select("entityType, entityId")
      .single();

    if (error) throw new Error((error as { message: string }).message);

    if (updated) revalidateWorkflowPaths(updated.entityType, updated.entityId, id);

    return { success: true };
  } catch (error) {
    console.error("[completeWorkflow] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Reopen a completed workflow.
 */
export async function reopenWorkflow(id: string) {
  try {
    await verifyStaff();

    const now = new Date().toISOString();

    const { data: updated, error } = await supabaseServer
      .from(INSTANCES_TABLE)
      .update({ completedAt: null, completedBy: null, updatedAt: now })
      .eq("id", id)
      .select("entityType, entityId")
      .single();

    if (error) throw new Error((error as { message: string }).message);

    if (updated) revalidateWorkflowPaths(updated.entityType, updated.entityId, id);

    return { success: true };
  } catch (error) {
    console.error("[reopenWorkflow] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch all upcoming/outstanding workflow steps assigned to any team the user belongs to.
 */
export async function getUpcomingWorkflowStepsForUser(userId: string, limit = 5) {
  try {
    // 1. Fetch user's team memberships and all teams for name resolution
    const [userMembershipsRes, allTeamsRes, clientsRes, companiesRes] = await Promise.all([
      supabaseServer.from("team_members").select("teamId").eq("userId", userId),
      supabaseServer.from("teams").select("id, name"),
      supabaseServer.from("clients").select("id, personId"),
      supabaseServer.from("companies").select("id, name"),
    ]);

    const userTeamIds = new Set((userMembershipsRes.data || []).map((m) => m.teamId));
    const teamsMap = new Map<string, string>();
    for (const t of allTeamsRes.data || []) {
      teamsMap.set(t.id, t.name);
    }

    // 2. Fetch person names for client entities
    const personIds = [...new Set((clientsRes.data || []).map((c) => c.personId).filter(Boolean))];
    const personNames = new Map<string, string>();
    if (personIds.length > 0) {
      const { data: persons } = await supabaseServer
        .from("people")
        .select("id, firstName, lastName, suffix, goesBy")
        .in("id", personIds);

      for (const p of persons || []) {
        personNames.set(p.id, formatFullName(p.firstName, p.lastName, p.suffix, "", p.goesBy));
      }
    }

    const entityNames = new Map<string, string>();
    for (const c of clientsRes.data || []) {
      entityNames.set(`client:${c.id}`, personNames.get(c.personId) || "Unnamed Client");
    }
    for (const c of companiesRes.data || []) {
      entityNames.set(`company:${c.id}`, c.name || "Unnamed Company");
    }

    // 3. Fetch active workflow instances
    const { data: instances, error: instancesError } = await supabaseServer
      .from(INSTANCES_TABLE)
      .select("*, workflow_instance_steps(*)")
      .is("completedAt", null);

    if (instancesError) throw new Error(instancesError.message);

    const steps: Array<
      WorkflowInstanceStep & {
        workflowId: string;
        workflowName: string;
        entityType: WorkflowEntityType;
        entityId: string;
        entityName: string;
        responsibilityLabel: string;
      }
    > = [];

    for (const w of instances || []) {
      const entityName = entityNames.get(`${w.entityType}:${w.entityId}`) || "Unknown Entity";
      const wSteps = (w.workflow_instance_steps || []) as WorkflowInstanceStep[];

      // Surface the next incomplete step
      const nextStep = [...wSteps].sort((a, b) => a.sortOrder - b.sortOrder).find((s) => !s.completedAt);

      if (nextStep) {
        const resp = nextStep.responsibility;
        // Check if the step is assigned to a team the user belongs to, or legacy 'advisor'
        const isUserResponsible = userTeamIds.has(resp) || resp === "advisor";

        if (isUserResponsible) {
          const respLabel = teamsMap.get(resp) || (resp === "advisor" ? "Advisor" : "Client / Company");
          steps.push({
            ...nextStep,
            workflowId: w.id,
            workflowName: w.name,
            entityType: w.entityType,
            entityId: w.entityId,
            entityName,
            responsibilityLabel: respLabel,
          });
        }
      }
    }

    // Sort steps: due date ascending first, then createdAt ascending
    steps.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const limitedSteps = steps.slice(0, limit);

    return { success: true, steps: limitedSteps };
  } catch (error) {
    console.error("[getUpcomingWorkflowStepsForUser] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch entity documentUrl and name for a client or company.
 */
export async function getEntityDocumentUrl(entityType: WorkflowEntityType, entityId: string) {
  try {
    if (entityType === "client") {
      const { data: client } = await supabaseServer
        .from("clients")
        .select("id, documentUrl, personId")
        .eq("id", entityId)
        .single();

      let name = "Client";
      if (client?.personId) {
        const { data: person } = await supabaseServer
          .from("people")
          .select("firstName, lastName, suffix, goesBy")
          .eq("id", client.personId)
          .single();
        if (person) {
          name = formatFullName(person.firstName, person.lastName, person.suffix, "Client", person.goesBy);
        }
      }
      return { success: true, documentUrl: client?.documentUrl || null, name };
    }

    const { data: company } = await supabaseServer
      .from("companies")
      .select("id, documentUrl, name")
      .eq("id", entityId)
      .single();

    return {
      success: true,
      documentUrl: company?.documentUrl || null,
      name: company?.name || "Company",
    };
  } catch (error) {
    console.error("[getEntityDocumentUrl] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update a workflow instance's description.
 */
export async function updateWorkflowDescription(workflowId: string, description: string) {
  try {
    await verifyStaff();

    const { data: instance, error } = await supabaseServer
      .from(INSTANCES_TABLE)
      .update({ description, updatedAt: new Date().toISOString() })
      .eq("id", workflowId)
      .select("entityType, entityId")
      .single();

    if (error) throw new Error(error.message);

    if (instance) {
      revalidateWorkflowPaths(instance.entityType as WorkflowEntityType, instance.entityId, workflowId);
    }

    return { success: true };
  } catch (error) {
    console.error("[updateWorkflowDescription] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
