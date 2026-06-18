require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

async function main() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='law_firms'
    `;
    console.log('Columns law_firms:', columns.map(c => c.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
main();
