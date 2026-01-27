/**
 * Migration script: Update existing prospect avatars to 50-point difficulty model
 * - Adds execution resistance (default 5) to existing difficulty_index
 * - Recalculates difficulty_tier based on new 50-point bands
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function migrate() {
  try {
    console.log('Starting migration to 50-point difficulty model...');

    // Step 1: Update difficulty_index and recalculate difficulty_tier
    const result = await sql`
      UPDATE prospect_avatars 
      SET 
        difficulty_index = difficulty_index + execution_resistance,
        difficulty_tier = CASE
          WHEN (difficulty_index + execution_resistance) >= 43 THEN 'easy'
          WHEN (difficulty_index + execution_resistance) >= 37 THEN 'realistic'
          WHEN (difficulty_index + execution_resistance) >= 31 THEN 'hard'
          WHEN (difficulty_index + execution_resistance) >= 25 THEN 'elite'
          ELSE 'near_impossible'
        END
      WHERE execution_resistance IS NOT NULL;
    `;

    console.log(`✅ Migrated ${result.count} prospect avatars to 50-point model`);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

migrate();
