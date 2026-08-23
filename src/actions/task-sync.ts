import "server-only";

import { supabaseServer } from "@/lib/supabase.server";
import { formatFullName } from "@/lib/utils";
import type { TaskCategory, TaskSourceType } from "@/types/crm";

/**
 * Auto-generated task engine.
 *
 * Each auto task is anchored by (sourceType, sourceRefId) and kept idempotent by a
 * partial unique index. Birthdays/anniversaries recur annually (due date rolls to the
 * next occurrence); renewals track the policy's explicit renewalDate. All functions are
 * best-effort and never throw, so they can't break the parent mutation that triggers them.
 */

const TASKS = "tasks";
const ASSIGNEES = "task_assignees";
const ASSOCIATIONS = "task_associations";

interface Association {
  entityType: "client" | "company";
  entityId: string;
}

/** Returns the next upcoming YYYY-MM-DD for an annually recurring date (this year or next). */
function nextAnnualOccurrence(dateStr: string, now = new Date()): string {
  const monthDay = dateStr.slice(5, 10); // "MM-DD"
  const year = now.getUTCFullYear();
  const today = now.toISOString().slice(0, 10);
  const thisYear = `${year}-${monthDay}`;
  // Lexicographic comparison is valid for zero-padded ISO dates.
  return thisYear < today ? `${year + 1}-${monthDay}` : thisYear;
}

/** Derives the renewal label from which insurance carrier a policy references. */
function policyKind(policy: {
  lifeInsuranceCompanyId?: string | null;
  disabilityInsuranceCompanyId?: string | null;
  longTermCareInsuranceId?: string | null;
}): string {
  if (policy.lifeInsuranceCompanyId) return "Life Insurance";
  if (policy.disabilityInsuranceCompanyId) return "Disability Insurance";
  if (policy.longTermCareInsuranceId) return "Long Term Care";
  return "Policy";
}

interface UpsertArgs {
  sourceType: TaskSourceType;
  sourceRefId: string;
  name: string;
  dueDate: string; // YYYY-MM-DD
  category: TaskCategory;
  assigneeUserId?: string | null;
  association: Association;
}

/** Creates or updates the single auto task for an anchor, keeping it idempotent. */
async function upsertAutoTask(args: UpsertArgs): Promise<void> {
  const { sourceType, sourceRefId, name, dueDate, category, assigneeUserId, association } = args;
  const now = new Date().toISOString();

  try {
    const { data: existing } = await supabaseServer
      .from(TASKS)
      .select("id, status")
      .eq("source", "auto")
      .eq("sourceType", sourceType)
      .eq("sourceRefId", sourceRefId)
      .maybeSingle();

    let taskId: string;
    if (existing) {
      const updates: Record<string, unknown> = { name, category, dueDate, updatedAt: now };
      // Rolling to a fresh occurrence: revive a completed task for the new cycle.
      if (existing.status === "Complete") {
        updates.status = "New";
        updates.completeDate = null;
      }
      await supabaseServer.from(TASKS).update(updates).eq("id", existing.id);
      taskId = existing.id;
    } else {
      const { data: inserted, error } = await supabaseServer
        .from(TASKS)
        .insert({
          name,
          status: "New",
          category,
          priority: "Low",
          dueDate,
          source: "auto",
          sourceType,
          sourceRefId,
          createdAt: now,
          updatedAt: now,
        })
        .select("id")
        .single();
      if (error || !inserted) return;
      taskId = inserted.id;
    }

    // Ensure the owning advisor is an assignee (no-op if already present or unknown).
    if (assigneeUserId) {
      await supabaseServer.from(ASSIGNEES).upsert({ taskId, userId: assigneeUserId }, { onConflict: "taskId,userId" });
    }
    // Ensure the entity association exists.
    await supabaseServer
      .from(ASSOCIATIONS)
      .upsert(
        { taskId, entityType: association.entityType, entityId: association.entityId },
        { onConflict: "taskId,entityType,entityId" },
      );
  } catch (err) {
    console.error(`[task-sync] upsert ${sourceType}:${sourceRefId} failed`, err);
  }
}

/** Removes the auto task for an anchor (e.g. when the underlying date is cleared). */
export async function removeAutoTask(sourceType: TaskSourceType, sourceRefId: string): Promise<void> {
  try {
    await supabaseServer
      .from(TASKS)
      .delete()
      .eq("source", "auto")
      .eq("sourceType", sourceType)
      .eq("sourceRefId", sourceRefId);
  } catch (err) {
    console.error(`[task-sync] remove ${sourceType}:${sourceRefId} failed`, err);
  }
}

/** Syncs a client's birthday task from people.pii.birthDate (anchored on personId). */
export async function syncBirthdayForPerson(personId: string): Promise<void> {
  try {
    const { data: client } = await supabaseServer
      .from("clients")
      .select("id, advisorId, pii")
      .eq("personId", personId)
      .maybeSingle();
    if (!client) return; // birthdays are tracked for clients only

    const { data: person } = await supabaseServer
      .from("people")
      .select("firstName, lastName, suffix, goesBy")
      .eq("id", personId)
      .maybeSingle();
    const birthDate = (client.pii as { birthDate?: string } | null)?.birthDate;

    if (!birthDate) {
      await removeAutoTask("birthday", personId);
      return;
    }

    await upsertAutoTask({
      sourceType: "birthday",
      sourceRefId: personId,
      name: `${person?.goesBy || person?.firstName || "Client"}'s Birthday`,
      dueDate: nextAnnualOccurrence(birthDate),
      category: "Birthday",
      assigneeUserId: client.advisorId,
      association: { entityType: "client", entityId: client.id },
    });
  } catch (err) {
    console.error(`[task-sync] syncBirthdayForPerson ${personId} failed`, err);
  }
}

/** Syncs a client's wedding-anniversary task from the Spouse family member's marriageDate. */
export async function syncAnniversaryForClient(clientId: string): Promise<void> {
  try {
    const { data: client } = await supabaseServer
      .from("clients")
      .select("id, advisorId, personId, familyMembers")
      .eq("id", clientId)
      .maybeSingle();
    if (!client) return;

    const family = (client.familyMembers as { relationship?: string; marriageDate?: string }[] | null) ?? [];
    const spouse = family.find((m) => m.relationship === "Spouse" && m.marriageDate);

    if (!spouse?.marriageDate) {
      await removeAutoTask("anniversary", clientId);
      return;
    }

    const { data: person } = await supabaseServer
      .from("people")
      .select("firstName, lastName, suffix, goesBy")
      .eq("id", client.personId)
      .maybeSingle();
    const clientName = formatFullName(person?.firstName, person?.lastName, person?.suffix, "Client", person?.goesBy);

    await upsertAutoTask({
      sourceType: "anniversary",
      sourceRefId: clientId,
      name: `Wedding Anniversary — ${clientName}`,
      dueDate: nextAnnualOccurrence(spouse.marriageDate),
      category: "Wedding Anniversary",
      assigneeUserId: client.advisorId,
      association: { entityType: "client", entityId: client.id },
    });
  } catch (err) {
    console.error(`[task-sync] syncAnniversaryForClient ${clientId} failed`, err);
  }
}

/** Syncs a policy-renewal task from client_policies.renewalDate (anchored on policyId). */
export async function syncRenewalForPolicy(policyId: string): Promise<void> {
  try {
    const { data: policy } = await supabaseServer
      .from("client_policies")
      .select(
        "id, clientId, policyName, renewalDate, lifeInsuranceCompanyId, disabilityInsuranceCompanyId, longTermCareInsuranceId",
      )
      .eq("id", policyId)
      .maybeSingle();
    if (!policy?.renewalDate) {
      await removeAutoTask("renewal", policyId);
      return;
    }

    const { data: client } = await supabaseServer
      .from("clients")
      .select("id, advisorId")
      .eq("id", policy.clientId)
      .maybeSingle();
    if (!client) return;

    await upsertAutoTask({
      sourceType: "renewal",
      sourceRefId: policyId,
      name: `${policyKind(policy)} renewal — ${policy.policyName}`,
      dueDate: String(policy.renewalDate).slice(0, 10),
      category: "Policy Renewal",
      assigneeUserId: client.advisorId,
      association: { entityType: "client", entityId: client.id },
    });
  } catch (err) {
    console.error(`[task-sync] syncRenewalForPolicy ${policyId} failed`, err);
  }
}

/**
 * Full sweep used by the daily cron: rolls every recurring task forward to its next
 * occurrence and backfills any missing anchors. Returns counts for observability.
 */
export async function syncAllAutoTasks(): Promise<{
  success: boolean;
  clients: number;
  policies: number;
  error?: string;
}> {
  try {
    const { data: clients } = await supabaseServer.from("clients").select("id, personId");
    const { data: policies } = await supabaseServer.from("client_policies").select("id");

    for (const c of clients ?? []) {
      await syncBirthdayForPerson(c.personId);
      await syncAnniversaryForClient(c.id);
    }
    for (const p of policies ?? []) {
      await syncRenewalForPolicy(p.id);
    }

    return { success: true, clients: clients?.length ?? 0, policies: policies?.length ?? 0 };
  } catch (err) {
    console.error("[task-sync] syncAllAutoTasks failed", err);
    return { success: false, clients: 0, policies: 0, error: (err as Error).message };
  }
}
