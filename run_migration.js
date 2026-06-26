const postgres = require("postgres");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

function sanitizeConnectionString(url) {
  const regex = /^(postgresql:\/\/|postgres:\/\/)([^:]+):(.*)@([^@/]+:[0-9]+\/[^?#\s"]+)(.*)$/;
  const match = url.match(regex);
  if (!match) return url;

  const [, protocol, username, password, hostDb, rest] = match;
  let decodedPassword = password;
  try {
    decodedPassword = decodeURIComponent(password);
  } catch (_) {}
  const encodedPassword = encodeURIComponent(decodedPassword);
  return `${protocol}${username}:${encodedPassword}@${hostDb}${rest}`;
}

const url = sanitizeConnectionString(rawUrl);

async function run() {
  const sql = postgres(url, { max: 1 });
  try {
    await sql.unsafe('ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "paymentAccounts" jsonb DEFAULT \'[]\'::jsonb;');
    console.log("Migration successful");
  } catch (e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}
run();
