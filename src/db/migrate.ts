import dotenv from "dotenv";
import { DefaultLogger, type LogWriter } from "drizzle-orm/logger";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import dns from "node:dns";
import path from "node:path";

dns.setDefaultResultOrder("ipv4first");

dotenv.config({ path: ".env.local" });
dotenv.config();

// 1. Reuse your exact connection string logic
function sanitizeConnectionString(url: string): string {
  const regex = /^(postgresql:\/\/|postgres:\/\/)([^:]+):(.*)@([^@/]+:[0-9]+\/[^?#\s"]+)(.*)$/;
  const match = url.match(regex);
  if (!match) return url;

  const [, protocol, username, password, hostDb, rest] = match;
  let decodedPassword = password;
  try {
    decodedPassword = decodeURIComponent(password);
  } catch (_) {
    // Ignore decoding errors and fallback to original
  }
  const encodedPassword = encodeURIComponent(decodedPassword);
  return `${protocol}${username}:${encodedPassword}@${hostDb}${rest}`;
}

const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
let url = rawUrl ? sanitizeConnectionString(rawUrl) : "";

if (!url) {
  console.error("❌ Error: No database URL found in environment variables.");
  process.exit(1);
}

async function getIpv4CompatibleUrl(connectionUrl: string): Promise<string> {
  try {
    const parsed = new URL(connectionUrl);
    const hostname = parsed.hostname;

    try {
      const addresses = await dns.promises.resolve4(hostname);
      if (addresses && addresses.length > 0) {
        return connectionUrl;
      }
    } catch (_err) {
      // resolve4 threw ENODATA/ENOTFOUND -> IPv6-only host
    }

    const match = hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
    if (match) {
      const ref = match[1];
      console.warn(
        `⚠️ Host ${hostname} is IPv6-only. Falling back to Supabase IPv4 Session Pooler (aws-0-us-east-1.pooler.supabase.com)...`,
      );
      if (!parsed.username.includes(".")) {
        parsed.username = `${parsed.username}.${ref}`;
      }
      parsed.hostname = "aws-0-us-east-1.pooler.supabase.com";
      return parsed.toString();
    }
  } catch (_e) {
    // Ignore URL parse errors
  }
  return connectionUrl;
}

// 2. Setup the verbose console logger
class VerboseLogWriter implements LogWriter {
  write(message: string) {
    console.log(`[DRIZZLE SQL] -> ${message}`);
  }
}
const verboseLogger = new DefaultLogger({ writer: new VerboseLogWriter() });

// 3. Run programmatic migration
async function runMigration() {
  console.log("⏱️ Starting Supabase migrations with verbose logs...");

  url = await getIpv4CompatibleUrl(url);

  // max: 1 is recommended for migrations to prevent locking issues
  const migrationClient = postgres(url, { max: 1 });
  const db = drizzle(migrationClient, { logger: verboseLogger });

  try {
    // Matches your 'out' folder in drizzle.config.ts
    const migrationsPath = path.resolve(process.cwd(), "supabase/migrations");
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("✅ Migrations completed successfully.");
  } catch (error) {
    console.error("❌ Migration execution failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigration();
