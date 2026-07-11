"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser, supabaseServer } from "@/lib/supabase.server";
import { type WorkflowTemplate, type WorkflowTemplateListItem, WorkflowTemplateSchema } from "@/types/workflows";

const TEMPLATES_TABLE = "workflow_templates";
const STEPS_TABLE = "workflow_template_steps";

/**
 * Helper to verify that the current user is authenticated and has the admin role.
 * Returns the authenticated user.
 */
async function verifyAdmin() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Unauthorized: Please sign in.");
  }

  const { data: dbUser, error: dbUserError } = await supabaseServer
    .from("users")
    .select("role")
    .eq("uid", user.id)
    .single();

  if (dbUserError || !dbUser || dbUser.role !== "admin") {
    throw new Error("Unauthorized: Admin role required.");
  }

  return user;
}

/**
 * Fetch all workflow templates with their step counts, sorted alphabetically.
 */
export async function getWorkflowTemplates() {
  try {
    const { data: list, error } = await supabaseServer
      .from(TEMPLATES_TABLE)
      .select("id, name, description, createdAt, updatedAt, workflow_template_steps(id)")
      .order("name", { ascending: true });

    if (error) throw new Error((error as { message: string }).message);

    const templates: WorkflowTemplateListItem[] = (list || []).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      stepCount: (t.workflow_template_steps || []).length,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return { success: true, templates };
  } catch (error) {
    console.error("[getWorkflowTemplates] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch a single workflow template with its steps ordered by sortOrder.
 */
export async function getWorkflowTemplate(id: string) {
  try {
    const { data: record, error } = await supabaseServer.from(TEMPLATES_TABLE).select("*").eq("id", id).single();

    if (error) throw new Error((error as { message: string }).message);

    const { data: steps, error: stepsError } = await supabaseServer
      .from(STEPS_TABLE)
      .select("*")
      .eq("templateId", id)
      .order("sortOrder", { ascending: true });

    if (stepsError) throw new Error((stepsError as { message: string }).message);

    return { success: true, template: { ...record, steps: steps || [] } as WorkflowTemplate };
  } catch (error) {
    console.error("[getWorkflowTemplate] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

function toStepRow(templateId: string, step: WorkflowTemplate["steps"][number], sortOrder: number) {
  return {
    templateId,
    name: step.name,
    sortOrder,
    setDueDate: step.setDueDate,
    dueDays: step.setDueDate ? step.dueDays : null,
    dueDateBase: step.setDueDate ? step.dueDateBase : null,
    priority: step.priority,
    description: step.description ?? null,
    responsibility: step.responsibility,
    attachments: step.attachments ?? [],
  };
}

/**
 * Create a new workflow template with its steps. Only allowed for admins.
 */
export async function createWorkflowTemplate(data: Partial<WorkflowTemplate>) {
  try {
    const user = await verifyAdmin();

    const validated = WorkflowTemplateSchema.parse(data);

    const { data: inserted, error } = await supabaseServer
      .from(TEMPLATES_TABLE)
      .insert({
        name: validated.name,
        description: validated.description ?? null,
        createdBy: user.id,
      })
      .select()
      .single();

    if (error) throw new Error((error as { message: string }).message);

    const { error: stepsError } = await supabaseServer
      .from(STEPS_TABLE)
      .insert(validated.steps.map((step, index) => toStepRow(inserted.id, step, index)));

    if (stepsError) throw new Error((stepsError as { message: string }).message);

    revalidatePath("/dashboard/admin/workflows");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error("[createWorkflowTemplate] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update an existing workflow template and replace its steps. Only allowed for admins.
 */
export async function updateWorkflowTemplate(id: string, data: Partial<WorkflowTemplate>) {
  try {
    await verifyAdmin();

    const validated = WorkflowTemplateSchema.parse(data);

    const { error } = await supabaseServer
      .from(TEMPLATES_TABLE)
      .update({
        name: validated.name,
        description: validated.description ?? null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    // Replace steps wholesale — instances hold their own snapshot, so this is safe.
    const { error: deleteError } = await supabaseServer.from(STEPS_TABLE).delete().eq("templateId", id);
    if (deleteError) throw new Error((deleteError as { message: string }).message);

    const { error: stepsError } = await supabaseServer
      .from(STEPS_TABLE)
      .insert(validated.steps.map((step, index) => toStepRow(id, step, index)));

    if (stepsError) throw new Error((stepsError as { message: string }).message);

    revalidatePath("/dashboard/admin/workflows");
    revalidatePath(`/dashboard/admin/workflows/${id}/edit`);

    return { success: true };
  } catch (error) {
    console.error("[updateWorkflowTemplate] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete a workflow template (steps cascade). Only allowed for admins.
 * Existing workflow instances keep their snapshot copies.
 */
export async function deleteWorkflowTemplate(id: string) {
  try {
    await verifyAdmin();

    const { error } = await supabaseServer.from(TEMPLATES_TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/workflows");

    return { success: true };
  } catch (error) {
    console.error("[deleteWorkflowTemplate] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
