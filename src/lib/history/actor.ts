import "server-only";

import { cookies } from "next/headers";

import { supabaseServer } from "@/lib/supabase.server";

export interface HistoryActor {
  actorId: string | null;
  actorName: string;
}

const SYSTEM_ACTOR: HistoryActor = { actorId: null, actorName: "System" };

/**
 * Reads the Supabase access token from the request cookies.
 *
 * The Supabase JS client stores the session in a cookie named
 * `sb-<projectRef>-auth-token`. Large sessions are split across chunked
 * cookies (`...-auth-token.0`, `.1`, ...) and may be prefixed with `base64-`.
 * This mirrors the parsing done in src/middleware.ts but works in a server-action
 * context via next/headers.
 */
async function readAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const all = cookieStore.getAll();

    // Collect the base auth-token cookie plus any chunked continuations.
    const authCookies = all
      .filter((c) => c.name.startsWith("sb-") && (c.name.endsWith("-auth-token") || /-auth-token\.\d+$/.test(c.name)))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    if (authCookies.length === 0) return null;

    let raw = authCookies.map((c) => c.value).join("");
    raw = decodeURIComponent(raw);
    if (raw.startsWith("base64-")) {
      raw = Buffer.from(raw.slice("base64-".length), "base64").toString("utf-8");
    }

    const session = JSON.parse(raw) as { access_token?: string };
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolves the currently logged-in user for change-history attribution.
 * Falls back to the "System" actor when no valid session is present
 * (e.g. seed scripts, background jobs, or unauthenticated writes).
 */
export async function getCurrentActor(): Promise<HistoryActor> {
  try {
    const accessToken = await readAccessToken();
    if (!accessToken) return SYSTEM_ACTOR;

    const {
      data: { user },
      error,
    } = await supabaseServer.auth.getUser(accessToken);

    if (error || !user) return SYSTEM_ACTOR;

    // Prefer the friendly name from public.users; fall back to email.
    const { data: dbUser } = await supabaseServer
      .from("users")
      .select("firstName, lastName, email")
      .eq("uid", user.id)
      .single();

    const fullName = [dbUser?.firstName, dbUser?.lastName].filter(Boolean).join(" ").trim();
    const actorName = fullName || dbUser?.email || user.email || "Unknown User";

    return { actorId: user.id, actorName };
  } catch {
    return SYSTEM_ACTOR;
  }
}
