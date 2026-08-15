"use server";

import { supabaseServer } from "@/lib/supabase.server";
import { formatFullName } from "@/lib/utils";
import type { ChangeHistory, ChangeHistoryEntityType, ChangeHistoryWithEntity } from "@/types/crm";

const TABLE = "change_history";

/**
 * Fetches the full change history for a single client or company,
 * sorted by change date descending.
 */
export async function getEntityHistory(entityType: ChangeHistoryEntityType, entityId: string | string[]) {
  try {
    let query = supabaseServer.from(TABLE).select("*").eq("entityType", entityType);

    if (Array.isArray(entityId)) {
      if (entityId.length === 0) return { success: true, history: [] as ChangeHistory[] };
      query = query.in("entityId", entityId);
    } else {
      query = query.eq("entityId", entityId);
    }

    const { data, error } = await query.order("changedAt", { ascending: false });

    if (error) throw new Error(error.message);
    return { success: true, history: (data || []) as ChangeHistory[] };
  } catch (error) {
    console.error("[getEntityHistory] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/** Resolves display names for a set of client and company entity ids. */
async function resolveEntityNames(rows: ChangeHistory[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();

  const clientIds = Array.from(new Set(rows.filter((r) => r.entityType === "client").map((r) => r.entityId)));
  const companyIds = Array.from(new Set(rows.filter((r) => r.entityType === "company").map((r) => r.entityId)));

  if (companyIds.length > 0) {
    const { data: companies } = await supabaseServer.from("companies").select("id, name").in("id", companyIds);
    for (const c of companies || []) names.set(c.id, c.name);
  }

  if (clientIds.length > 0) {
    const { data: clients } = await supabaseServer.from("clients").select("id, personId").in("id", clientIds);
    const personIds = Array.from(new Set((clients || []).map((c) => c.personId).filter(Boolean)));
    const peopleMap = new Map<string, string>();
    if (personIds.length > 0) {
      const { data: people } = await supabaseServer
        .from("people")
        .select("id, firstName, lastName, suffix")
        .in("id", personIds);
      for (const p of people || []) {
        peopleMap.set(p.id, formatFullName(p.firstName, p.lastName, p.suffix));
      }
    }
    for (const c of clients || []) names.set(c.id, peopleMap.get(c.personId) || "Unknown Client");
  }

  return names;
}

export interface HistoryFilters {
  search?: string;
  entityType?: ChangeHistoryEntityType | "all";
  subType?: string | "all";
  limit?: number;
}

/**
 * Fetches change history across all clients and companies for the report view,
 * resolves entity display names, and applies free-text search across all fields
 * (including the resolved entity name). Sorted by change date descending.
 */
export async function getAllHistory(filters: HistoryFilters = {}) {
  try {
    const { search, entityType, subType, limit = 1000 } = filters;

    let query = supabaseServer.from(TABLE).select("*").order("changedAt", { ascending: false }).limit(limit);

    if (entityType && entityType !== "all") query = query.eq("entityType", entityType);
    if (subType && subType !== "all") query = query.eq("subType", subType);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const rows = (data || []) as ChangeHistory[];
    const names = await resolveEntityNames(rows);

    let enriched: ChangeHistoryWithEntity[] = rows.map((r) => ({
      ...r,
      entityName: names.get(r.entityId) ?? null,
    }));

    if (search?.trim()) {
      const term = search.trim().toLowerCase();
      enriched = enriched.filter((r) =>
        [r.entityName, r.subType, r.summary, r.fieldLabel, r.oldValue, r.newValue, r.actorName]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(term)),
      );
    }

    return { success: true, history: enriched };
  } catch (error) {
    console.error("[getAllHistory] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
