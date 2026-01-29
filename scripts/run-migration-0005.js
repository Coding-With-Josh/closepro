import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = postgres(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('Running migration 0005_update_offers_schema.sql...');
    
    const migrationPath = join(__dirname, '..', 'drizzle', '0005_update_offers_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    await sql.unsafe(migrationSQL);
    
    console.log('✓ Migration 0005 completed successfully');
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    await sql.end();
    process.exit(1);
  }
}

runMigration();
