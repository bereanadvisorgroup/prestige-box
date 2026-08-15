import "server-only";

import { supabaseServer } from "@/lib/supabase.server";
import { formatFullName } from "@/lib/utils";

/**
 * Resolves a set of person UUIDs to formatted full name display strings.
 * Ids that can't be resolved map to themselves so nothing is lost.
 */
export async function resolvePersonNames(ids: Array<string | null | undefined>): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = Array.from(new Set(ids.filter((id): id is string => !!id)));
  if (unique.length === 0) return map;

  const { data } = await supabaseServer.from("people").select("id, firstName, lastName, suffix").in("id", unique);
  for (const p of data ?? []) {
    const name = formatFullName(p.firstName, p.lastName, p.suffix);
    map.set(p.id, name || p.id);
  }
  return map;
}
