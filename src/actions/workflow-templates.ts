"use server";

import { revalidatePath } from "next/cache";

import { randomUUID } from "crypto";

import { supabaseAdmin, supabaseServer, verifyAdmin } from "@/lib/supabase.server";
import { type WorkflowTemplate, type WorkflowTemplateListItem, WorkflowTemplateSchema } from "@/types/workflows";

const TEMPLATES_TABLE = "workflow_templates";
const STEPS_TABLE = "workflow_template_steps";

/**
 * Fetch all workflow templates with their step counts, sorted alphabetically.
 */
export async function getWorkflowTemplates() {
  try {
    const { data: list, error } = await supabaseServer
      .from(TEMPLATES_TABLE)
      .select("id, name, description, createdAt, updatedAt, workflow_template_steps(id), workflow_instances(id)")
      .order("name", { ascending: true });

    if (error) throw new Error((error as { message: string }).message);

    const templates: WorkflowTemplateListItem[] = (list || []).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      stepCount: (t.workflow_template_steps || []).length,
      isLinked: (t.workflow_instances || []).length > 0,
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

    const stepsList = steps || [];
    let graph = record.graph || { nodes: [], edges: [] };

    // Automatically convert old linear templates to layout graph on the fly
    if ((!graph.nodes || graph.nodes.length === 0) && stepsList.length > 0) {
      const nodes: any[] = [{ id: "start", type: "start", position: { x: 100, y: 250 }, data: { label: "Start" } }];
      const edges: any[] = [];

      stepsList.forEach((step, idx) => {
        nodes.push({
          id: step.id,
          type: "step",
          position: { x: 300 + idx * 250, y: 200 },
          data: { label: step.name, step },
        });

        if (idx === 0) {
          edges.push({ id: `e-start-${step.id}`, source: "start", target: step.id });
        } else {
          const prevStep = stepsList[idx - 1];
          edges.push({
            id: `e-${prevStep.id}-${step.id}`,
            source: prevStep.id,
            target: step.id,
            sourceHandle: prevStep.outcomes?.[0]?.id || "default",
          });
        }
      });

      const lastStep = stepsList[stepsList.length - 1];
      nodes.push({
        id: "end",
        type: "end",
        position: { x: 300 + stepsList.length * 250, y: 250 },
        data: { label: "End" },
      });
      edges.push({
        id: `e-${lastStep.id}-end`,
        source: lastStep.id,
        target: "end",
        sourceHandle: lastStep.outcomes?.[0]?.id || "default",
      });

      graph = { nodes, edges };
    }

    return { success: true, template: { ...record, graph, steps: stepsList } as WorkflowTemplate };
  } catch (error) {
    console.error("[getWorkflowTemplate] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

function toStepRow(templateId: string, step: WorkflowTemplate["steps"][number], sortOrder: number) {
  return {
    id: step.id || randomUUID(),
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
    outcomes: step.outcomes ?? [],
    positionX: step.positionX ?? 0,
    positionY: step.positionY ?? 0,
  };
}

/**
 * Create a new workflow template with its steps. Only allowed for admins.
 */
export async function createWorkflowTemplate(data: Partial<WorkflowTemplate>) {
  try {
    const user = await verifyAdmin();

    const validated = WorkflowTemplateSchema.parse(data);

    const { data: inserted, error } = await supabaseAdmin
      .from(TEMPLATES_TABLE)
      .insert({
        name: validated.name,
        description: validated.description ?? null,
        graph: validated.graph ?? { nodes: [], edges: [] },
        createdBy: user.id,
      })
      .select()
      .single();

    if (error) throw new Error((error as { message: string }).message);

    const { error: stepsError } = await supabaseAdmin
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

    const { error } = await supabaseAdmin
      .from(TEMPLATES_TABLE)
      .update({
        name: validated.name,
        description: validated.description ?? null,
        graph: validated.graph ?? { nodes: [], edges: [] },
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    // Fetch existing steps for differential updates
    const { data: existingSteps, error: fetchError } = await supabaseAdmin
      .from(STEPS_TABLE)
      .select("id")
      .eq("templateId", id);

    if (fetchError) throw new Error((fetchError as { message: string }).message);

    const existingIds = new Set((existingSteps || []).map((s) => s.id));
    const incomingSteps = validated.steps.map((step, index) => toStepRow(id, step, index));
    const incomingIds = new Set(incomingSteps.map((s) => s.id));

    // Steps to delete: in existing, not in incoming
    const toDeleteIds = [...existingIds].filter((existingId) => !incomingIds.has(existingId));

    // Steps to insert: in incoming, not in existing
    const toInsert = incomingSteps.filter((s) => !existingIds.has(s.id));

    // Steps to update: in incoming and in existing
    const toUpdate = incomingSteps.filter((s) => existingIds.has(s.id));

    if (toDeleteIds.length > 0) {
      const { error: deleteError } = await supabaseAdmin.from(STEPS_TABLE).delete().in("id", toDeleteIds);
      if (deleteError) throw new Error((deleteError as { message: string }).message);
    }

    if (toInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin.from(STEPS_TABLE).insert(toInsert);
      if (insertError) throw new Error((insertError as { message: string }).message);
    }

    for (const step of toUpdate) {
      const { error: updateError } = await supabaseAdmin.from(STEPS_TABLE).update(step).eq("id", step.id);
      if (updateError) throw new Error((updateError as { message: string }).message);
    }

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

    const { error } = await supabaseAdmin.from(TEMPLATES_TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/workflows");

    return { success: true };
  } catch (error) {
    console.error("[deleteWorkflowTemplate] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
