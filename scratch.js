require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');

async function main() {
  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    const migrationSql = fs.readFileSync('supabase/migrations/0018_green_ikaris.sql', 'utf8');
    console.log('Running migration:');
    console.log(migrationSql);
    
    // We can execute multiple statements by passing the string to sql.unsafe
    await sql.unsafe(migrationSql);
    
    // Notify postgrest just in case
    await sql`NOTIFY pgrst, 'reload schema'`;
    console.log('Migration applied and PostgREST notified!');
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
main();
