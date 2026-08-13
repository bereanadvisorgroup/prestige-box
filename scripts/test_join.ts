import dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const client = createClient(supabaseUrl, serviceRoleKey);

async function testJoin() {
  console.log("Testing join query: clients with person...");
  
  const { data: clients, error } = await client
    .from("clients")
    .select("*, person:people(*)")
    .limit(5);

  console.log("Error:", error);
  console.log("Clients count:", clients?.length);
  if (clients && clients.length > 0) {
    console.log("Sample client with person:", clients[0].id, clients[0].person?.firstName, clients[0].person?.lastName);
  }
}

testJoin().catch(console.error);
