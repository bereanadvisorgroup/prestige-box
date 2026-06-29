import "server-only";

import { supabaseServer } from "@/lib/supabase.server";

/**
 * Resolves a set of person UUIDs to "LastName, FirstName" display strings.
 * Ids that can't be resolved map to themselves so nothing is lost.
 */
export async function resolvePersonNames(ids: Array<string | null | undefined>): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = Array.from(new Set(ids.filter((id): id is string => !!id)));
  if (unique.length === 0) return map;

  const { data } = await supabaseServer.from("people").select("id, firstName, lastName").in("id", unique);
  for (const p of data ?? []) {
    const name = [p.lastName, p.firstName].filter(Boolean).join(", ");
    map.set(p.id, name || p.id);
  }
  return map;
}
