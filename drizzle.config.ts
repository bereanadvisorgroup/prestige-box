import { defineConfig } from "drizzle-kit";

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

const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || process.env.SUPABASE_DIRECT_URL_DEV || "";
const url = rawUrl ? sanitizeConnectionString(rawUrl) : "";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
