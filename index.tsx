import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { users } from "./drizzle/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

export const allUsers = await db.select().from(users);
