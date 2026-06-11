import "server-only";
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
  get(target, prop, receiver) {
    const activeClient = getClient();
    const value = Reflect.get(activeClient, prop, receiver);
    if (typeof value === "function") {
      return value.bind(activeClient);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    const activeClient = getClient();
    return Reflect.set(activeClient, prop, value, receiver);
  },
  ownKeys(target) {
    const activeClient = getClient();
    return Reflect.ownKeys(activeClient);
  },
  getOwnPropertyDescriptor(target, prop) {
    const activeClient = getClient();
    return Reflect.getOwnPropertyDescriptor(activeClient, prop);
  },
});
