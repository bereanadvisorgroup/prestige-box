"use server";

import { revalidatePath } from "next/cache";

import { notifyTaskAssignees } from "@/actions/notifications";
import { getCurrentActor, recordEvent } from "@/lib/history/record";
import { supabaseServer } from "@/lib/supabase.server";
import { formatFullName } from "@/lib/utils";
import {
  type Task,
  type TaskAction,
  type TaskAssigneeRef,
  type TaskAssociationRef,
  type TaskFormInput,
  TaskFormSchema,
  type TaskFormValues,
  type TaskStatus,
  type TaskWithRelations,
} from "@/types/crm";

const TABLE = "tasks";
const ASSIGNEES = "task_assignees";
const ASSOCIATIONS = "task_associations";

export interface TaskFilter {
  clientId?: string;
  clientIds?: string[];
  companyId?: string;
  personId?: string;
  assigneeId?: string;
}

/**
 * Applies the complete-date rule:
 * - moving INTO Complete stamps completeDate (if not already set)
 * - moving OUT OF Complete clears it
 */
function resolveCompleteDate(
  prevStatus: string | undefined,
  nextStatus: string,
  prevComplete: string | null,
): string | null {
  if (nextStatus === "Complete") {
    return prevStatus === "Complete" && prevComplete ? prevComplete : new Date().toISOString();
  }
  if (nextStatus === "Archived") {
    return prevComplete;
  }
  return null;
}

function resolveArchiveDate(
  prevStatus: string | undefined,
  nextStatus: string,
  prevArchive: string | null,
): string | null {
  if (nextStatus === "Archived") {
    return prevStatus === "Archived" && prevArchive ? prevArchive : new Date().toISOString();
  }
  return null;
}

/** Resolves display names for a set of associations (clients via person, companies directly, people directly). */
async function resolveAssociationNames(rows: { entityType: string; entityId: string }[]): Promise<Map<string, string>> {
  const names = new Map<string, string>(); // key: `${entityType}:${entityId}`
  const clientIds = Array.from(new Set(rows.filter((r) => r.entityType === "client").map((r) => r.entityId)));
  const companyIds = Array.from(new Set(rows.filter((r) => r.entityType === "company").map((r) => r.entityId)));
  const personIds = Array.from(new Set(rows.filter((r) => r.entityType === "person").map((r) => r.entityId)));

  if (clientIds.length > 0) {
    const { data: clients } = await supabaseServer.from("clients").select("id, personId").in("id", clientIds);
    const clientPersonIds = Array.from(new Set((clients || []).map((c) => c.personId)));
    const { data: people } = clientPersonIds.length
      ? await supabaseServer.from("people").select("id, firstName, lastName, suffix, goesBy").in("id", clientPersonIds)
      : { data: [] };
    const peopleMap = new Map(
      (people || []).map((p) => [p.id, formatFullName(p.firstName, p.lastName, p.suffix, "", p.goesBy)]),
    );
    for (const c of clients || []) {
      names.set(`client:${c.id}`, peopleMap.get(c.personId) || "Unknown client");
    }
  }

  if (companyIds.length > 0) {
    const { data: companies } = await supabaseServer.from("companies").select("id, name").in("id", companyIds);
    for (const c of companies || []) names.set(`company:${c.id}`, c.name || "Unknown company");
  }

  if (personIds.length > 0) {
    const { data: people } = await supabaseServer
      .from("people")
      .select("id, firstName, lastName, suffix, goesBy")
      .in("id", personIds);
    for (const p of people || []) {
      names.set(`person:${p.id}`, formatFullName(p.firstName, p.lastName, p.suffix, "", p.goesBy) || "Unknown person");
    }
  }

  return names;
}

/** Enriches bare task rows with their assignees and associations. */
async function enrichTasks(taskRows: Task[]): Promise<TaskWithRelations[]> {
  if (taskRows.length === 0) return [];
  const taskIds = taskRows.map((t) => t.id as string);

  const [{ data: assigneeRows }, { data: associationRows }] = await Promise.all([
    supabaseServer.from(ASSIGNEES).select("taskId, userId").in("taskId", taskIds),
    supabaseServer.from(ASSOCIATIONS).select("taskId, entityType, entityId").in("taskId", taskIds),
  ]);

  // Resolve assignee user names.
  const userIds = Array.from(new Set((assigneeRows || []).map((a) => a.userId)));
  const { data: users } = userIds.length
    ? await supabaseServer.from("users").select("uid, firstName, lastName, role").in("uid", userIds)
    : { data: [] };
  const userMap = new Map(
    (users || []).map((u) => [
      u.uid,
      { name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unknown", role: u.role },
    ]),
  );

  const nameMap = await resolveAssociationNames(associationRows || []);

  const assigneesByTask = new Map<string, TaskAssigneeRef[]>();
  for (const a of assigneeRows || []) {
    const u = userMap.get(a.userId);
    const list = assigneesByTask.get(a.taskId) ?? [];
    list.push({ userId: a.userId, name: u?.name || "Unknown", role: u?.role });
    assigneesByTask.set(a.taskId, list);
  }

  const associationsByTask = new Map<string, TaskAssociationRef[]>();
  for (const a of associationRows || []) {
    const list = associationsByTask.get(a.taskId) ?? [];
    list.push({
      entityType: a.entityType as TaskAssociationRef["entityType"],
      entityId: a.entityId,
      name: nameMap.get(`${a.entityType}:${a.entityId}`) || "Unknown",
    });
    associationsByTask.set(a.taskId, list);
  }

  return taskRows.map((t) => ({
    ...t,
    assignees: assigneesByTask.get(t.id as string) ?? [],
    associations: associationsByTask.get(t.id as string) ?? [],
  }));
}

export async function getTasks(filter: TaskFilter = {}) {
  try {
    let taskIds: string[] | null = null;

    if (filter.clientIds && filter.clientIds.length > 0) {
      const { data, error } = await supabaseServer
        .from(ASSOCIATIONS)
        .select("taskId")
        .eq("entityType", "client")
        .in("entityId", filter.clientIds);
      if (error) throw new Error(error.message);
      taskIds = Array.from(new Set((data || []).map((r) => r.taskId)));
    } else if (filter.clientId || filter.companyId || filter.personId) {
      const entityType = filter.clientId ? "client" : filter.companyId ? "company" : "person";
      const entityId = (filter.clientId ?? filter.companyId ?? filter.personId) as string;
      const { data, error } = await supabaseServer
        .from(ASSOCIATIONS)
        .select("taskId")
        .eq("entityType", entityType)
        .eq("entityId", entityId);
      if (error) throw new Error(error.message);
      taskIds = Array.from(new Set((data || []).map((r) => r.taskId)));
    }

    if (filter.assigneeId) {
      const { data, error } = await supabaseServer.from(ASSIGNEES).select("taskId").eq("userId", filter.assigneeId);
      if (error) throw new Error(error.message);
      const assignedIds = Array.from(new Set((data || []).map((r) => r.taskId)));
      taskIds = taskIds ? taskIds.filter((id) => assignedIds.includes(id)) : assignedIds;
    }

    if (taskIds !== null && taskIds.length === 0) return { success: true, tasks: [] as TaskWithRelations[] };

    let query = supabaseServer.from(TABLE).select("*").order("dueDate", { ascending: true });
    if (taskIds !== null) query = query.in("id", taskIds);

    const { data: taskRows, error } = await query;
    if (error) throw new Error(error.message);

    const tasks = await enrichTasks((taskRows || []) as Task[]);
    return { success: true, tasks };
  } catch (error) {
    console.error("[getTasks] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getTaskById(id: string) {
  try {
    const { data: task, error } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    if (!task) return { success: false, error: "Task not found" };
    const [enriched] = await enrichTasks([task as Task]);
    return { success: true, task: enriched };
  } catch (error) {
    console.error("[getTaskById] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

/** Replaces the assignee/association junction rows for a task. */
async function syncJunctions(taskId: string, values: Pick<TaskFormValues, "assigneeIds" | "associations">) {
  await Promise.all([
    supabaseServer.from(ASSIGNEES).delete().eq("taskId", taskId),
    supabaseServer.from(ASSOCIATIONS).delete().eq("taskId", taskId),
  ]);

  const assigneeRows = values.assigneeIds.map((userId) => ({ taskId, userId }));
  const associationRows = values.associations.map((a) => ({
    taskId,
    entityType: a.entityType,
    entityId: a.entityId,
  }));

  await Promise.all([
    assigneeRows.length ? supabaseServer.from(ASSIGNEES).insert(assigneeRows) : Promise.resolve(),
    associationRows.length ? supabaseServer.from(ASSOCIATIONS).insert(associationRows) : Promise.resolve(),
  ]);
}

function revalidateTaskAssociations(associations?: { entityType: string; entityId: string }[]) {
  revalidatePath("/dashboard/crm/tasks");
  for (const a of associations || []) {
    if (a.entityType === "client") revalidatePath(`/dashboard/crm/clients/${a.entityId}`);
    if (a.entityType === "company") revalidatePath(`/dashboard/crm/companies/${a.entityId}`);
    if (a.entityType === "person") revalidatePath(`/dashboard/crm/people/${a.entityId}`);
  }
}

export async function createTask(values: TaskFormInput) {
  try {
    const parsed = TaskFormSchema.parse(values);
    const actor = await getCurrentActor();

    const now = new Date().toISOString();
    const insertData = {
      name: parsed.name,
      status: parsed.status,
      category: parsed.category,
      priority: parsed.priority,
      description: parsed.description ?? null,
      attachments: parsed.attachments ?? [],
      actions: parsed.actions ?? [],
      dueDate: parsed.dueDate,
      completeDate: resolveCompleteDate(undefined, parsed.status, null),
      archiveDate: resolveArchiveDate(undefined, parsed.status, null),
      source: "manual" as const,
      createdBy: actor.actorId,
      createdAt: now,
      updatedAt: now,
    };

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(insertData).select().single();
    if (error) throw new Error(error.message);

    await syncJunctions(inserted.id, parsed);

    await recordEvent(
      {
        entityType: "task",
        entityId: inserted.id,
        subType: "Task",
        action: "created",
        summary: `Task "${parsed.name}" created`,
      },
      actor,
    );

    revalidateTaskAssociations(parsed.associations);
    return { success: true, id: inserted.id as string };
  } catch (error) {
    console.error("[createTask] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateTask(id: string, values: TaskFormInput) {
  try {
    const parsed = TaskFormSchema.parse(values);
    const actor = await getCurrentActor();

    const { data: current } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();
    if (!current) return { success: false, error: "Task not found" };

    const updateData = {
      name: parsed.name,
      status: parsed.status,
      category: parsed.category,
      priority: parsed.priority,
      description: parsed.description ?? null,
      attachments: parsed.attachments ?? [],
      actions: parsed.actions ?? current.actions ?? [],
      dueDate: parsed.dueDate,
      completeDate: resolveCompleteDate(current.status, parsed.status, current.completeDate ?? null),
      archiveDate: resolveArchiveDate(current.status, parsed.status, current.archiveDate ?? null),
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);
    if (error) throw new Error(error.message);

    await syncJunctions(id, parsed);

    if (current.status !== parsed.status) {
      await recordEvent(
        {
          entityType: "task",
          entityId: id,
          subType: "Task",
          action: "updated",
          fieldName: "status",
          fieldLabel: "Status",
          oldValue: current.status,
          newValue: parsed.status,
          summary: `Status changed to ${parsed.status}`,
        },
        actor,
      );
    } else {
      await recordEvent(
        {
          entityType: "task",
          entityId: id,
          subType: "Task",
          action: "updated",
          summary: `Task "${parsed.name}" updated`,
        },
        actor,
      );
    }

    // Notify assignees of the update (excluding the actor)
    const assigneeIds = parsed.assigneeIds || [];
    const isStatusChanged = current.status !== parsed.status;
    await notifyTaskAssignees({
      taskId: id,
      taskName: parsed.name,
      actorId: actor.actorId,
      actorName: actor.actorName,
      assigneeIds,
      actionType: isStatusChanged ? "status_changed" : "updated",
      status: parsed.status,
    });

    revalidateTaskAssociations(parsed.associations);
    return { success: true };
  } catch (error) {
    console.error("[updateTask] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function addTaskAction(taskId: string, text: string) {
  try {
    const trimmed = text.trim();
    if (!trimmed) {
      return { success: false, error: "Action text cannot be empty" };
    }

    const [{ data: current, error: fetchErr }, { data: assocRows }] = await Promise.all([
      supabaseServer.from(TABLE).select("name, actions").eq("id", taskId).single(),
      supabaseServer.from(ASSOCIATIONS).select("entityType, entityId").eq("taskId", taskId),
    ]);

    if (fetchErr || !current) {
      return { success: false, error: "Task not found" };
    }

    const actor = await getCurrentActor();
    const newAction: TaskAction = {
      id: crypto.randomUUID(),
      text: trimmed,
      createdAt: new Date().toISOString(),
      createdBy: actor.actorId,
      createdByName: actor.actorName,
    };

    const existingActions = Array.isArray(current.actions) ? (current.actions as TaskAction[]) : [];
    const updatedActions = [newAction, ...existingActions];

    const { error: updateErr } = await supabaseServer
      .from(TABLE)
      .update({
        actions: updatedActions,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (updateErr) throw new Error(updateErr.message);

    await recordEvent(
      {
        entityType: "task",
        entityId: taskId,
        subType: "Task",
        action: "updated",
        summary: `Added action to "${current.name}": ${trimmed}`,
      },
      actor,
    );

    revalidateTaskAssociations(assocRows || []);
    return { success: true, action: newAction, actions: updatedActions };
  } catch (error) {
    console.error("[addTaskAction] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteTaskAction(taskId: string, actionId: string) {
  try {
    const [{ data: current, error: fetchErr }, { data: assocRows }] = await Promise.all([
      supabaseServer.from(TABLE).select("name, actions").eq("id", taskId).single(),
      supabaseServer.from(ASSOCIATIONS).select("entityType, entityId").eq("taskId", taskId),
    ]);

    if (fetchErr || !current) {
      return { success: false, error: "Task not found" };
    }

    const actor = await getCurrentActor();
    const existingActions = Array.isArray(current.actions) ? (current.actions as TaskAction[]) : [];
    const updatedActions = existingActions.filter((a) => a.id !== actionId);

    const { error: updateErr } = await supabaseServer
      .from(TABLE)
      .update({
        actions: updatedActions,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (updateErr) throw new Error(updateErr.message);

    await recordEvent(
      {
        entityType: "task",
        entityId: taskId,
        subType: "Task",
        action: "updated",
        summary: `Deleted action from "${current.name}"`,
      },
      actor,
    );

    revalidateTaskAssociations(assocRows || []);
    return { success: true, actions: updatedActions };
  } catch (error) {
    console.error("[deleteTaskAction] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

/** Lightweight status-only update used by the Kanban board drag interaction. */
export async function updateTaskStatus(id: string, status: TaskStatus) {
  try {
    const [{ data: current }, { data: assocRows }, { data: assigneeRows }] = await Promise.all([
      supabaseServer.from(TABLE).select("status, completeDate, archiveDate, name").eq("id", id).single(),
      supabaseServer.from(ASSOCIATIONS).select("entityType, entityId").eq("taskId", id),
      supabaseServer.from(ASSIGNEES).select("userId").eq("taskId", id),
    ]);
    if (!current) return { success: false, error: "Task not found" };

    const actor = await getCurrentActor();

    const { error } = await supabaseServer
      .from(TABLE)
      .update({
        status,
        completeDate: resolveCompleteDate(current.status, status, current.completeDate ?? null),
        archiveDate: resolveArchiveDate(current.status, status, current.archiveDate ?? null),
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);

    if (current.status !== status) {
      await recordEvent(
        {
          entityType: "task",
          entityId: id,
          subType: "Task",
          action: "updated",
          fieldName: "status",
          fieldLabel: "Status",
          oldValue: current.status,
          newValue: status,
          summary: `Status changed to ${status}`,
        },
        actor,
      );

      // Notify task assignees of the status update
      const assigneeIds = (assigneeRows || []).map((a) => a.userId);
      await notifyTaskAssignees({
        taskId: id,
        taskName: current.name,
        actorId: actor.actorId,
        actorName: actor.actorName,
        assigneeIds,
        actionType: "status_changed",
        status,
      });
    }

    revalidateTaskAssociations(assocRows || []);
    return { success: true };
  } catch (error) {
    console.error("[updateTaskStatus] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteTask(id: string) {
  try {
    const [{ data: current }, { data: assocRows }] = await Promise.all([
      supabaseServer.from(TABLE).select("name").eq("id", id).single(),
      supabaseServer.from(ASSOCIATIONS).select("entityType, entityId").eq("taskId", id),
    ]);
    // Junction rows are removed by ON DELETE CASCADE.
    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);

    await recordEvent({
      entityType: "task",
      entityId: id,
      subType: "Task",
      action: "deleted",
      summary: `Task "${current?.name ?? id}" deleted`,
    });

    revalidateTaskAssociations(assocRows || []);
    return { success: true };
  } catch (error) {
    console.error("[deleteTask] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

/**
 * The N soonest non-Complete tasks assigned to a user, ordered by due date
 * (overdue included first). Powers the CRM dashboard Tasks card.
 */
export async function getUpcomingTasksForUser(userId: string, limit = 5) {
  try {
    const { data: assignedRows, error: assignedError } = await supabaseServer
      .from(ASSIGNEES)
      .select("taskId")
      .eq("userId", userId);
    if (assignedError) throw new Error(assignedError.message);

    const taskIds = Array.from(new Set((assignedRows || []).map((r) => r.taskId)));
    if (taskIds.length === 0) return { success: true, tasks: [] as TaskWithRelations[] };

    const { data: taskRows, error } = await supabaseServer
      .from(TABLE)
      .select("*")
      .in("id", taskIds)
      .neq("status", "Complete")
      .neq("status", "Archived")
      .order("dueDate", { ascending: true })
      .limit(limit);
    if (error) throw new Error(error.message);

    const tasks = await enrichTasks((taskRows || []) as Task[]);
    return { success: true, tasks };
  } catch (error) {
    console.error("[getUpcomingTasksForUser] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}
