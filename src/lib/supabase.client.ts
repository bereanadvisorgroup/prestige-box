import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase client environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured.",
    );
  }

  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}

export const supabase = new Proxy({} as unknown as SupabaseClient, {
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
