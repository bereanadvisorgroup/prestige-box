import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

declare global {
  // Use var for global scope declarations in TS
  var supabaseClient: postgres.Sql | undefined;
}

function sanitizeConnectionString(url: string): string {
  const regex = /^(postgresql:\/\/|postgres:\/\/)([^:]+):(.*)@([^@/]+:[0-9]+\/[^?#\s"]+)(.*)$/;
  const match = url.match(regex);
  if (!match) return url;

  const [, protocol, username, password, hostDb, rest] = match;

  let decodedPassword = password;
  try {
    decodedPassword = decodeURIComponent(password);
  } catch (_) {
    // Fall back to original if decoding fails (e.g. because of unescaped percent sign)
  }

  const encodedPassword = encodeURIComponent(decodedPassword);
  return `${protocol}${username}:${encodedPassword}@${hostDb}${rest}`;
}

const rawConnectionString = process.env.DATABASE_URL;
if (!rawConnectionString) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const connectionString = sanitizeConnectionString(rawConnectionString);

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = globalThis.supabaseClient || postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== "production") {
  globalThis.supabaseClient = client;
}

export const db = drizzle(client, { schema });
