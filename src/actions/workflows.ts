"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser, supabaseServer } from "@/lib/supabase.server";
import type { WorkflowEntityType, WorkflowInstance, WorkflowInstanceStep } from "@/types/workflows";

const INSTANCES_TABLE = "workflow_instances";
const INSTANCE_STEPS_TABLE = "workflow_instance_steps";
const TEMPLATE_STEPS_TABLE = "workflow_template_steps";

/**
 * Helper to verify the current user is an authenticated admin or advisor.
 * Returns the authenticated user.
 */
async function verifyStaff() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Unauthorized: Please sign in.");
  }

  const { data: dbUser, error: dbUserError } = await supabaseServer
    .from("users")
    .select("role")
    .eq("uid", user.id)
    .single();

  if (dbUserError || !dbUser || !["admin", "advisor"].includes(dbUser.role)) {
    throw new Error("Unauthorized: Admin or Advisor role required.");
  }

  return user;
}

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

/**
 * Create a new workflow for a client or company as a snapshot copy of a template.
 */
export async function createWorkflowFromTemplate(templateId: string, entityType: WorkflowEntityType, entityId: string) {
  try {
    const user = await verifyStaff();

    const { data: template, error: templateError } = await supabaseServer
      .from("workflow_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) throw new Error("Workflow template not found.");

    const { data: templateSteps, error: stepsError } = await supabaseServer
      .from(TEMPLATE_STEPS_TABLE)
      .select("*")
      .eq("templateId", templateId)
      .order("sortOrder", { ascending: true });

    if (stepsError) throw new Error((stepsError as { message: string }).message);

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

    const stepRows = (templateSteps || []).map((step, index) => {
      // Steps based on the workflow start date get a due date immediately.
      // "After last step completed" due dates resolve when the prior step is
      // completed — except for the first step, whose "last step" is the start.
      let dueDate: string | null = null;
      if (step.setDueDate && step.dueDays) {
        if (step.dueDateBase === "workflow_start" || index === 0) {
          dueDate = addDays(startDate, step.dueDays);
        }
      }

      return {
        instanceId: instance.id,
        name: step.name,
        sortOrder: index,
        setDueDate: step.setDueDate,
        dueDays: step.dueDays,
        dueDateBase: step.dueDateBase,
        priority: step.priority,
        description: step.description,
        responsibility: step.responsibility,
        attachments: step.attachments ?? [],
        dueDate,
      };
    });

    if (stepRows.length > 0) {
      const { error: insertStepsError } = await supabaseServer.from(INSTANCE_STEPS_TABLE).insert(stepRows);
      if (insertStepsError) throw new Error((insertStepsError as { message: string }).message);
    }

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
export async function getWorkflows(entityType: WorkflowEntityType, entityId: string) {
  try {
    const { data: list, error } = await supabaseServer
      .from(INSTANCES_TABLE)
      .select("*, workflow_instance_steps(*)")
      .eq("entityType", entityType)
      .eq("entityId", entityId)
      .order("createdAt", { ascending: false });

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
        .select("id, firstName, lastName")
        .in("id", personIds);
      for (const p of persons || []) {
        personNames.set(p.id, `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim());
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
 * Mark a workflow step complete or incomplete.
 * Completing a step resolves the next step's "after last step completed" due
 * date; un-completing clears it again and reopens a completed workflow.
 */
export async function setWorkflowStepCompletion(stepId: string, completed: boolean) {
  try {
    const user = await verifyStaff();

    const { data: step, error: stepError } = await supabaseServer
      .from(INSTANCE_STEPS_TABLE)
      .select("*")
      .eq("id", stepId)
      .single();

    if (stepError || !step) throw new Error("Workflow step not found.");

    const now = new Date();

    const { error: updateError } = await supabaseServer
      .from(INSTANCE_STEPS_TABLE)
      .update({
        completedAt: completed ? now.toISOString() : null,
        completedBy: completed ? user.id : null,
        updatedAt: now.toISOString(),
      })
      .eq("id", stepId);

    if (updateError) throw new Error((updateError as { message: string }).message);

    // Resolve or clear the next step's "after last step completed" due date.
    const { data: nextStep } = await supabaseServer
      .from(INSTANCE_STEPS_TABLE)
      .select("id, setDueDate, dueDays, dueDateBase, completedAt")
      .eq("instanceId", step.instanceId)
      .eq("sortOrder", step.sortOrder + 1)
      .maybeSingle();

    if (nextStep?.setDueDate && nextStep.dueDateBase === "after_last_step" && nextStep.dueDays) {
      await supabaseServer
        .from(INSTANCE_STEPS_TABLE)
        .update({
          dueDate: completed ? addDays(now, nextStep.dueDays) : null,
          updatedAt: now.toISOString(),
        })
        .eq("id", nextStep.id);
    }

    // Un-completing a step reopens a completed workflow.
    if (!completed) {
      await supabaseServer
        .from(INSTANCES_TABLE)
        .update({ completedAt: null, completedBy: null, updatedAt: now.toISOString() })
        .eq("id", step.instanceId)
        .not("completedAt", "is", null);
    } else {
      await supabaseServer.from(INSTANCES_TABLE).update({ updatedAt: now.toISOString() }).eq("id", step.instanceId);
    }

    const { data: instance } = await supabaseServer
      .from(INSTANCES_TABLE)
      .select("entityType, entityId")
      .eq("id", step.instanceId)
      .single();

    if (instance) revalidateWorkflowPaths(instance.entityType, instance.entityId, step.instanceId);

    return { success: true };
  } catch (error) {
    console.error("[setWorkflowStepCompletion] Error:", error);
    return { success: false, error: (error as Error).message };
  }
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
