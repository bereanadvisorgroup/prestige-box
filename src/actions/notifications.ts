"use server";

import { getCurrentActor } from "@/lib/history/record";
import { supabaseServer } from "@/lib/supabase.server";
import type { NoteNotification } from "@/types/notes";

const NOTIFICATIONS = "note_notifications";

export async function getNotifications(limit = 20) {
  try {
    const actor = await getCurrentActor();
    if (!actor.actorId) return { success: true, notifications: [] as NoteNotification[], unread: 0 };

    const { data, error } = await supabaseServer
      .from(NOTIFICATIONS)
      .select("*")
      .eq("recipientId", actor.actorId)
      .order("createdAt", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);

    const notifications: NoteNotification[] = (data || []).map((n) => ({
      id: n.id,
      noteId: n.noteId ?? null,
      rootId: n.rootId ?? null,
      taskId: n.taskId ?? null,
      linkUrl: n.linkUrl ?? null,
      actorName: n.actorName ?? null,
      type: n.type,
      preview: n.preview ?? null,
      isRead: n.isRead ?? false,
      createdAt: n.createdAt,
    }));
    const unread = notifications.filter((n) => !n.isRead).length;
    return { success: true, notifications, unread };
  } catch (error) {
    console.error("[getNotifications] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function markNotificationRead(id: string) {
  try {
    const { error } = await supabaseServer.from(NOTIFICATIONS).update({ isRead: true }).eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function markAllNotificationsRead() {
  try {
    const actor = await getCurrentActor();
    if (!actor.actorId) return { success: true };
    const { error } = await supabaseServer
      .from(NOTIFICATIONS)
      .update({ isRead: true })
      .eq("recipientId", actor.actorId)
      .eq("isRead", false);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as { message: string }).message };
  }
}

/** Clears a single notification (scoped to the current user). */
export async function deleteNotification(id: string) {
  try {
    const actor = await getCurrentActor();
    if (!actor.actorId) return { success: false, error: "Not signed in" };
    const { error } = await supabaseServer.from(NOTIFICATIONS).delete().eq("id", id).eq("recipientId", actor.actorId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as { message: string }).message };
  }
}

/** Clears every notification for the current user. */
export async function clearAllNotifications() {
  try {
    const actor = await getCurrentActor();
    if (!actor.actorId) return { success: true };
    const { error } = await supabaseServer.from(NOTIFICATIONS).delete().eq("recipientId", actor.actorId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as { message: string }).message };
  }
}

export interface NotifyTaskAssigneesArgs {
  taskId: string;
  taskName: string;
  actorId: string | null;
  actorName: string;
  assigneeIds: string[];
  actionType?: "updated" | "status_changed";
  status?: string;
}

/**
 * Creates in-app notifications for task assignees when a task is updated or changes status.
 * Excludes the actor performing the update so they do not notify themselves.
 */
export async function notifyTaskAssignees(args: NotifyTaskAssigneesArgs) {
  try {
    const recipients = Array.from(new Set(args.assigneeIds.filter((uid) => Boolean(uid) && uid !== args.actorId)));
    if (recipients.length === 0) return { success: true, count: 0 };

    let preview = `${args.actorName} updated task "${args.taskName}"`;
    if (args.actionType === "status_changed" && args.status) {
      preview = `${args.actorName} marked task "${args.taskName}" as ${args.status}`;
    }

    const linkUrl = `/dashboard/crm/tasks?editTask=${args.taskId}`;

    const rows = recipients.map((recipientId) => ({
      taskId: args.taskId,
      recipientId,
      actorId: args.actorId,
      actorName: args.actorName,
      type: "task_updated",
      preview,
      linkUrl,
      isRead: false,
    }));

    const { error } = await supabaseServer.from(NOTIFICATIONS).insert(rows);
    if (error) throw new Error(error.message);

    return { success: true, count: rows.length };
  } catch (error) {
    console.error("[notifyTaskAssignees] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}
