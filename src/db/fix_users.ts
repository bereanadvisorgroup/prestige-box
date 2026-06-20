import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { eq, inArray } from "drizzle-orm";
import { jsonb, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { db } from "./index";
import { users } from "./schema";

const authSchema = pgSchema("auth");
const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email").unique(),
});
const authIdentities = authSchema.table("identities", {
  id: text("id").primaryKey(),
  userId: uuid("user_id"),
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanAndCreate() {
  const targetEmails = ["admin@prestigebox.dev", "staff1@prestigebox.dev", "client1@prestigebox.dev"];
  console.log("Deleting corrupted users from DB...");
  const existing = await db.select().from(authUsers).where(inArray(authUsers.email, targetEmails));
  const ids = existing.map((e) => e.id);

  if (ids.length > 0) {
    await db.delete(authIdentities).where(inArray(authIdentities.userId, ids));
    await db.delete(users).where(inArray(users.uid, ids));
    await db.delete(authUsers).where(inArray(authUsers.id, ids));
  }

  console.log("Creating users properly via Supabase Admin API...");
  const usersToCreate = [
    { email: "admin@prestigebox.dev", password: "password123", role: "admin", firstName: "Test", lastName: "Admin" },
    { email: "staff1@prestigebox.dev", password: "password123", role: "advisor", firstName: "Test", lastName: "Staff" },
    {
      email: "client1@prestigebox.dev",
      password: "password123",
      role: "client",
      firstName: "Test",
      lastName: "Client",
    },
  ];

  for (const u of usersToCreate) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
      },
    });
    if (error) {
      console.error(`Failed to create ${u.email}:`, error.message);
    } else {
      console.log(`Created ${u.email}`);
    }
  }
  console.log("Done");
  process.exit(0);
}

cleanAndCreate().catch(console.error);
