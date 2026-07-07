import "server-only";
import { cookies } from "next/headers";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase server environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are configured.",
    );
  }

  client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  return client;
}

export const supabaseServer = new Proxy({} as unknown as SupabaseClient, {
  get(_target, prop, receiver) {
    const activeClient = getClient();
    const value = Reflect.get(activeClient, prop, receiver);
    if (typeof value === "function") {
      return value.bind(activeClient);
    }
    return value;
  },
  set(_target, prop, value, receiver) {
    const activeClient = getClient();
    return Reflect.set(activeClient, prop, value, receiver);
  },
  ownKeys(_target) {
    const activeClient = getClient();
    return Reflect.ownKeys(activeClient);
  },
  getOwnPropertyDescriptor(_target, prop) {
    const activeClient = getClient();
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
    const accessToken = session?.access_token;
    if (!accessToken) return null;

    const {
      data: { user },
      error,
    } = await supabaseServer.auth.getUser(accessToken);

    if (error || !user) return null;
    return user;
  } catch (err) {
    console.error("Error retrieving user from cookies:", err);
    return null;
  }
}
