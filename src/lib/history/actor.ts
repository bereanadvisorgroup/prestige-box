import "server-only";

import { getAuthenticatedUser, supabaseAdmin } from "@/lib/supabase.server";

export interface HistoryActor {
  actorId: string | null;
  actorName: string;
}

const SYSTEM_ACTOR: HistoryActor = { actorId: null, actorName: "System" };

/**
 * Resolves the currently logged-in user for change-history attribution and note notifications.
 * Uses the canonical getAuthenticatedUser helper from supabase.server to validate session JWTs,
 * and retrieves user names from public.users via admin client to bypass RLS hurdles.
 */
export async function getCurrentActor(): Promise<HistoryActor> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return SYSTEM_ACTOR;

    // Prefer the friendly name from public.users; fall back to auth metadata or email.
    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select("firstName, lastName, email")
      .eq("uid", user.id)
      .maybeSingle();

    const fullName = [dbUser?.firstName, dbUser?.lastName].filter(Boolean).join(" ").trim();
    const metaName =
      [user.user_metadata?.firstName, user.user_metadata?.lastName].filter(Boolean).join(" ").trim() ||
      user.user_metadata?.name ||
      user.user_metadata?.full_name;
    const actorName = fullName || metaName || dbUser?.email || user.email || "Unknown User";

    return { actorId: user.id, actorName };
  } catch (err) {
    console.error("[getCurrentActor] Error resolving actor:", err);
    return SYSTEM_ACTOR;
  }
}
