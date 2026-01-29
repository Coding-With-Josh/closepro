import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function addColumn() {
  try {
    console.log('Adding core_offer_price column...');
    await sql`ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "core_offer_price" text;`;
    console.log('✓ Column added successfully');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

addColumn();
