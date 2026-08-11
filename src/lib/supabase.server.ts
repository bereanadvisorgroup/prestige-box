import "server-only";
import { cookies } from "next/headers";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let anonClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

function getServerClient() {
  if (anonClient) return anonClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase server environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are configured.",
    );
  }

  anonClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  return anonClient;
}

function getAdminClient() {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured.",
    );
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  return adminClient;
}

/**
 * User-scoped Supabase server client that respects Row Level Security (RLS).
 */
export const supabaseServer = new Proxy({} as unknown as SupabaseClient, {
  get(_target, prop, receiver) {
    const activeClient = getServerClient();
    const value = Reflect.get(activeClient, prop, receiver);
    if (typeof value === "function") {
      return value.bind(activeClient);
    }
    return value;
  },
  set(_target, prop, value, receiver) {
    const activeClient = getServerClient();
    return Reflect.set(activeClient, prop, value, receiver);
  },
  ownKeys(_target) {
    const activeClient = getServerClient();
    return Reflect.ownKeys(activeClient);
  },
  getOwnPropertyDescriptor(_target, prop) {
    const activeClient = getServerClient();
    return Reflect.getOwnPropertyDescriptor(activeClient, prop);
  },
});

/**
 * Administrative Supabase server client using the service role key for elevated backend operations.
 */
export const supabaseAdmin = new Proxy({} as unknown as SupabaseClient, {
  get(_target, prop, receiver) {
    const activeClient = getAdminClient();
    const value = Reflect.get(activeClient, prop, receiver);
    if (typeof value === "function") {
      return value.bind(activeClient);
    }
    return value;
  },
  set(_target, prop, value, receiver) {
    const activeClient = getAdminClient();
    return Reflect.set(activeClient, prop, value, receiver);
  },
  ownKeys(_target) {
    const activeClient = getAdminClient();
    return Reflect.ownKeys(activeClient);
  },
  getOwnPropertyDescriptor(_target, prop) {
    const activeClient = getAdminClient();
    return Reflect.getOwnPropertyDescriptor(activeClient, prop);
  },
});

/**
 * Reads the Supabase access token from the request cookies and validates it.
 * This ensures server actions can authenticate users on the server side.
 */
export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const all = cookieStore.getAll();

    // Target the current project's auth cookie specifically (like the proxy in
    // src/proxy.ts). Grabbing every `sb-*-auth-token` cookie and joining their
    // values corrupts the JSON when a stale cookie from a different Supabase
    // project ref is present — navigation still works (the proxy targets the
    // correct ref) but server actions fail with a silent "Unauthorized".
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] : "";
    const baseKey = projectRef ? `sb-${projectRef}-auth-token` : "";

    // The base cookie plus any chunked continuations (`.0`, `.1`, …) for the
    // SAME key, sorted numerically. Fall back to the first `sb-*-auth-token`
    // family found if the project ref can't be derived.
    const matchesKey = (name: string) =>
      baseKey
        ? name === baseKey || new RegExp(`^${baseKey}\\.\\d+$`).test(name)
        : name.startsWith("sb-") && (name.endsWith("-auth-token") || /-auth-token\.\d+$/.test(name));

    let authCookies = all
      .filter((c) => matchesKey(c.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    // Without a project ref, restrict the broad fallback to a single cookie
    // family so unrelated stale cookies never get concatenated together.
    if (!baseKey && authCookies.length > 0) {
      const familyBase = authCookies[0].name.replace(/\.\d+$/, "");
      authCookies = authCookies.filter((c) => c.name === familyBase || c.name.startsWith(`${familyBase}.`));
    }

    if (authCookies.length === 0) return null;

    let raw = authCookies.map((c) => c.value).join("");
    raw = decodeURIComponent(raw);
    if (raw.startsWith("base64-")) {
      raw = Buffer.from(raw.slice("base64-".length), "base64").toString("utf-8");
    }

    const session = JSON.parse(raw) as { access_token?: string };
    const accessToken = session?.access_token;
    if (!accessToken) return null;

    const {
      data: { user },
      error,
    } = await supabaseServer.auth.getUser(accessToken);

    if (error || !user) {
      console.error("[getAuthenticatedUser] getUser rejected the access token:", error?.message ?? "no user returned");
      return null;
    }
    return user;
  } catch (err) {
    console.error("Error retrieving user from cookies:", err);
    return null;
  }
}
