import "server-only";

import { supabaseServer } from "@/lib/supabase.server";
import type { ChangeHistoryAction, ChangeHistoryEntityType } from "@/types/crm";

import { getCurrentActor, type HistoryActor } from "./actor";

const TABLE = "change_history";

export interface FieldConfig {
  /** Key of the field on the record object. */
  name: string;
  /** Human-readable label shown in the history UI. */
  label: string;
  /** Optional formatter turning a raw value into a display string. */
  format?: (value: unknown) => string;
}

/**
 * Keys excluded from history values: internal identifiers that aren't
 * user-facing. `personId` is a UUID with no meaning in the history view.
 */
const IGNORED_KEYS = new Set(["id", "personId"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** True for an array that contains at least one object element. */
function isObjectArray(value: unknown): boolean {
  return Array.isArray(value) && value.some((e) => isPlainObject(e));
}

/**
 * Formats a JSON object as a human-readable, comma-separated "key: value" string
 * (e.g. "address: bob@gmail.com, type: Work"). Ignored keys (id, personId) are
 * omitted and keys are sorted, so the result is stable regardless of jsonb key order.
 */
function formatObjectEntries(value: unknown): string {
  if (!isPlainObject(value)) return formatValue(value);
  return Object.keys(value)
    .filter((k) => !IGNORED_KEYS.has(k))
    .sort()
    .map((k) => `${k}: ${formatValue(value[k])}`)
    .join(", ");
}

/** Default value formatter — produces a stable, human-readable string. */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    const sep = value.some((e) => isPlainObject(e)) ? " | " : ", ";
    return value.map((v) => (isPlainObject(v) ? formatObjectEntries(v) : formatValue(v))).join(sep);
  }
  if (isPlainObject(value)) return formatObjectEntries(value);
  return String(value);
}

interface FieldEventPart {
  action: ChangeHistoryAction;
  fieldName: string;
  fieldLabel: string;
  oldValue: string | null;
  newValue: string | null;
  summary: string;
}

/**
 * Diffs two JSON arrays of objects element-by-element, matching elements by
 * their `id` (falling back to position when ids are absent). Produces one part
 * per element that was added, removed, or changed — formatted as readable
 * "key: value" strings with the `id` omitted. Removed elements are marked
 * "REMOVED" (e.g. "address: bob@gmail.com" → "REMOVED").
 */
function diffObjectArray(fieldName: string, label: string, beforeVal: unknown, afterVal: unknown): FieldEventPart[] {
  const beforeArr = Array.isArray(beforeVal) ? beforeVal : [];
  const afterArr = Array.isArray(afterVal) ? afterVal : [];

  const everyHasId = [...beforeArr, ...afterArr].every((e) => isPlainObject(e) && e.id != null);
  const keyOf = (el: unknown, i: number) => (everyHasId ? `id:${(el as Record<string, unknown>).id}` : `idx:${i}`);

  const beforeMap = new Map<string, unknown>();
  beforeArr.forEach((e, i) => {
    beforeMap.set(keyOf(e, i), e);
  });
  const afterMap = new Map<string, unknown>();
  afterArr.forEach((e, i) => {
    afterMap.set(keyOf(e, i), e);
  });

  // Preserve before-order, then append keys that only exist after.
  const order: string[] = [...beforeMap.keys()];
  for (const k of afterMap.keys()) if (!beforeMap.has(k)) order.push(k);

  const parts: FieldEventPart[] = [];
  for (const k of order) {
    const hasB = beforeMap.has(k);
    const hasA = afterMap.has(k);
    const bs = hasB ? formatObjectEntries(beforeMap.get(k)) : null;
    const as = hasA ? formatObjectEntries(afterMap.get(k)) : null;

    if (hasB && hasA) {
      if (bs !== as) {
        parts.push({
          action: "updated",
          fieldName,
          fieldLabel: label,
          oldValue: bs,
          newValue: as,
          summary: `${label} updated`,
        });
      }
    } else if (hasB) {
      parts.push({
        action: "removed",
        fieldName,
        fieldLabel: label,
        oldValue: bs,
        newValue: "REMOVED",
        summary: `${label} removed`,
      });
    } else {
      parts.push({
        action: "added",
        fieldName,
        fieldLabel: label,
        oldValue: null,
        newValue: as,
        summary: `${label} added`,
      });
    }
  }
  return parts;
}

interface HistoryEvent {
  entityType: ChangeHistoryEntityType;
  entityId: string;
  subType: string;
  action: ChangeHistoryAction;
  fieldName?: string | null;
  fieldLabel?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  summary?: string | null;
}

/**
 * Inserts history rows, stamping each with the acting user. Best-effort:
 * never throws, so a logging failure can't break the parent mutation
 * (mirrors the existing valuation-history pattern).
 */
async function insertRows(events: HistoryEvent[], actor?: HistoryActor): Promise<void> {
  if (events.length === 0) return;
  try {
    const resolved = actor ?? (await getCurrentActor());
    const now = new Date().toISOString();
    const rows = events.map((e) => ({
      entityType: e.entityType,
      entityId: e.entityId,
      subType: e.subType,
      action: e.action,
      fieldName: e.fieldName ?? null,
      fieldLabel: e.fieldLabel ?? null,
      oldValue: e.oldValue ?? null,
      newValue: e.newValue ?? null,
      summary: e.summary ?? null,
      actorId: resolved.actorId,
      actorName: resolved.actorName,
      changedAt: now,
      createdAt: now,
    }));

    const { error } = await supabaseServer.from(TABLE).insert(rows);
    if (error) {
      console.error("[history] Failed to insert change_history rows:", error.message);
    }
  } catch (err) {
    console.error("[history] Unexpected error recording history:", err);
  }
}

interface RecordFieldDiffsArgs {
  entityType: ChangeHistoryEntityType;
  entityId: string;
  subType: string;
  /** Previous state of the record (null for a brand-new record). */
  before: Record<string, unknown> | null;
  /** New state of the record. */
  after: Record<string, unknown>;
  /** Which fields to diff and how to label/format them. */
  fields: FieldConfig[];
  /** Pre-resolved actor, to avoid re-resolving across multiple calls in one mutation. */
  actor?: HistoryActor;
}

/**
 * Diffs the configured fields between `before` and `after` and records one
 * "updated" row per changed field, capturing old and new values.
 */
export async function recordFieldDiffs(args: RecordFieldDiffsArgs): Promise<void> {
  const { entityType, entityId, subType, before, after, fields, actor } = args;
  if (!before) return; // creation is recorded separately via recordEvent

  const events: HistoryEvent[] = [];
  for (const field of fields) {
    const bv = before[field.name];
    const av = after[field.name];

    // JSON arrays of objects are diffed element-by-element for a readable,
    // per-element history (added / removed / changed).
    if (!field.format && (isObjectArray(bv) || isObjectArray(av))) {
      for (const part of diffObjectArray(field.name, field.label, bv, av)) {
        events.push({ entityType, entityId, subType, ...part });
      }
      continue;
    }

    const fmt = field.format ?? formatValue;
    const oldStr = fmt(bv);
    const newStr = fmt(av);
    if (oldStr === newStr) continue;
    events.push({
      entityType,
      entityId,
      subType,
      action: "updated",
      fieldName: field.name,
      fieldLabel: field.label,
      oldValue: oldStr,
      newValue: newStr,
      summary: `${field.label} updated`,
    });
  }

  await insertRows(events, actor);
}

/** Records a single non-field event (created/deleted/added/removed). */
export async function recordEvent(event: HistoryEvent, actor?: HistoryActor): Promise<void> {
  await insertRows([event], actor);
}

/** Records multiple events sharing a single actor resolution (for fan-out). */
export async function recordEvents(events: HistoryEvent[]): Promise<void> {
  await insertRows(events);
}

export { getCurrentActor };
