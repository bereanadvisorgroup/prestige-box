// src/db/migrate.ts
import { DefaultLogger, type LogWriter } from "drizzle-orm/logger";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import path from "node:path";

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
const url = rawUrl ? sanitizeConnectionString(rawUrl) : "";

if (!url) {
  console.error("❌ Error: No database URL found in environment variables.");
  process.exit(1);
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
