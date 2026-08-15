import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import postgres from "postgres";

import * as fs from "node:fs";
import * as path from "node:path";

// Load environment variables from .env.local, fallback to .env
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
dotenv.config();

const OLD_DOMAIN = "prestigeprivateclient.com";
const NEW_DOMAIN = "prestigeadvisors360.com";

const supabaseDirectUrl = process.env.SUPABASE_DIRECT_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseDirectUrl) {
  console.error("❌ ERROR: SUPABASE_DIRECT_URL is not defined in environment or .env.local");
  process.exit(1);
}

// Initialize Supabase Admin client if API keys are available
const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

// Connect directly to the database via SUPABASE_DIRECT_URL
const sql = postgres(supabaseDirectUrl, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 30,
});

function transformEmail(email: string): string {
  return email.replace(new RegExp(`@${OLD_DOMAIN}$`, "i"), `@${NEW_DOMAIN}`);
}

async function updateUserEmails() {
  console.log("==================================================");
  console.log(`🔄 Updating user emails: @${OLD_DOMAIN} ➔ @${NEW_DOMAIN}`);
  console.log("==================================================\n");

  try {
    // 1. Query auth.users directly via SUPABASE_DIRECT_URL
    const matchingAuthUsers = await sql<
      {
        id: string;
        email: string | null;
        raw_user_meta_data: Record<string, unknown> | null;
      }[]
    >`
      SELECT id, email, raw_user_meta_data
      FROM auth.users
      WHERE email ILIKE ${`%@${OLD_DOMAIN}`}
    `;

    console.log(`🔍 Found ${matchingAuthUsers.length} user(s) in auth.users matching @${OLD_DOMAIN}:`);
    for (const u of matchingAuthUsers) {
      console.log(`  - [${u.id}] ${u.email}`);
    }
    console.log();

    let authUpdatedCount = 0;

    for (const authUser of matchingAuthUsers) {
      if (!authUser.email) continue;
      const newEmail = transformEmail(authUser.email).toLowerCase().trim();
      let updatedViaApi = false;

      // Try updating via Supabase Admin API first if available
      if (supabaseAdmin) {
        try {
          const { data, error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
            email: newEmail,
            email_confirm: true,
          });

          if (!error && data?.user) {
            console.log(`✅ [Admin API] Updated Auth user [${authUser.id}] to ${data.user.email}`);
            updatedViaApi = true;
          }
        } catch {
          // Fall through to direct DB update
        }
      }

      // If Admin API could not update (e.g. cross-project URL or direct DB target), update directly via SUPABASE_DIRECT_URL
      if (!updatedViaApi) {
        await sql`
          UPDATE auth.users
          SET
            email = ${newEmail},
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            email_change = '',
            email_change_token_new = '',
            email_change_token_current = '',
            email_change_confirm_status = 0,
            raw_user_meta_data = CASE
              WHEN raw_user_meta_data ? 'email' THEN
                jsonb_set(raw_user_meta_data, '{email}', to_jsonb(${newEmail}::text))
              ELSE raw_user_meta_data
            END,
            updated_at = now()
          WHERE id = ${authUser.id}
        `;

        // Update auth.identities (note: email column is generated from identity_data)
        await sql`
          UPDATE auth.identities
          SET
            identity_data = CASE
              WHEN identity_data ? 'email' THEN
                jsonb_set(identity_data, '{email}', to_jsonb(${newEmail}::text))
              ELSE identity_data
            END,
            updated_at = now()
          WHERE user_id = ${authUser.id}
        `;

        console.log(`✅ [Direct DB] Updated auth.users and auth.identities for [${authUser.id}] to ${newEmail}`);
      }

      authUpdatedCount++;
    }
    console.log();

    // 2. Query and update public.users table using SUPABASE_DIRECT_URL
    const matchingPublicUsers = await sql<{ uid: string; email: string }[]>`
      SELECT uid, email
      FROM public.users
      WHERE email ILIKE ${`%@${OLD_DOMAIN}`}
    `;

    console.log(`🔍 Found ${matchingPublicUsers.length} user(s) in public.users matching @${OLD_DOMAIN}:`);
    for (const u of matchingPublicUsers) {
      console.log(`  - [${u.uid}] ${u.email}`);
    }
    console.log();

    let publicUpdatedCount = 0;
    for (const publicUser of matchingPublicUsers) {
      const newEmail = transformEmail(publicUser.email).toLowerCase().trim();

      const updated = await sql`
        UPDATE public.users
        SET
          email = ${newEmail},
          "updatedAt" = now()
        WHERE uid = ${publicUser.uid}
        RETURNING uid, email
      `;

      if (updated.length > 0) {
        console.log(`✅ [Direct DB] Updated public.users [${publicUser.uid}] to ${updated[0].email}`);
        publicUpdatedCount++;
      }
    }

    // 3. Ensure any auth users updated have their public.users profile email synchronized
    for (const authUser of matchingAuthUsers) {
      if (!authUser.email) continue;
      const newEmail = transformEmail(authUser.email).toLowerCase().trim();

      const synced = await sql`
        UPDATE public.users
        SET
          email = ${newEmail},
          "updatedAt" = now()
        WHERE uid = ${authUser.id} AND email != ${newEmail}
        RETURNING uid, email
      `;

      if (synced.length > 0) {
        console.log(`✅ [Direct DB] Synced public.users profile for [${authUser.id}] to ${synced[0].email}`);
        publicUpdatedCount++;
      }
    }
    console.log();

    // 4. Verification Check
    const remainingAuth = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text as count
      FROM auth.users
      WHERE email ILIKE ${`%@${OLD_DOMAIN}`}
    `;
    const remainingPublic = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text as count
      FROM public.users
      WHERE email ILIKE ${`%@${OLD_DOMAIN}`}
    `;

    console.log("==================================================");
    console.log("🎉 Migration Summary:");
    console.log(`  - Auth Users Updated:      ${authUpdatedCount}`);
    console.log(`  - Public Users Updated:    ${publicUpdatedCount}`);
    console.log(`  - Remaining Old in Auth:   ${remainingAuth[0]?.count ?? "0"}`);
    console.log(`  - Remaining Old in Public: ${remainingPublic[0]?.count ?? "0"}`);
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Unexpected error during email update:", error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

updateUserEmails();
