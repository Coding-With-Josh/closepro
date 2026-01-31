/**
 * Add avatar_url column to prospect_avatars (for NanoBanana human photos).
 * Run: node scripts/add-avatar-url.js
 */
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function addAvatarUrl() {
  try {
    await sql`ALTER TABLE prospect_avatars ADD COLUMN IF NOT EXISTS avatar_url text`;
    console.log('✓ avatar_url column added to prospect_avatars');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

addAvatarUrl();
