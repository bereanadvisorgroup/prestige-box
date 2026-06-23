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

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key) => {
          if (typeof document !== "undefined") {
            const cookie = document.cookie.split("; ").find((row) => row.startsWith(`${key}=`));
            if (cookie) {
              try {
                return decodeURIComponent(cookie.split("=")[1]);
              } catch (e) {
                console.error("Error decoding auth cookie:", e);
              }
            }
          }
          if (typeof window !== "undefined") {
            return localStorage.getItem(key);
          }
          return null;
        },
        setItem: (key, value) => {
          if (typeof document !== "undefined") {
            // biome-ignore lint/suspicious/noDocumentCookie: Shared with server via cookies
            document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax; Secure`;
          }
          if (typeof window !== "undefined") {
            localStorage.setItem(key, value);
          }
        },
        removeItem: (key) => {
          if (typeof document !== "undefined") {
            // biome-ignore lint/suspicious/noDocumentCookie: Clear cookie on sign out
            document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
          if (typeof window !== "undefined") {
            localStorage.removeItem(key);
          }
        },
      },
      experimental: {
        passkey: true,
      },
    },
  });
  return client;
}

export const supabase = new Proxy({} as unknown as SupabaseClient, {
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
