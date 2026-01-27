-- Migration: Add execution_resistance column and migrate to 50-point difficulty model
-- This adds Layer B (Execution Resistance) to the prospect difficulty model

-- Step 1: Add execution_resistance column with default value
ALTER TABLE "prospect_avatars" 
ADD COLUMN "execution_resistance" integer DEFAULT 5 NOT NULL;

-- Step 2: Migrate existing data
-- Add execution resistance (default 5) to existing difficulty_index
-- Then recalculate difficulty_tier based on new 50-point bands
UPDATE "prospect_avatars" 
SET 
  "difficulty_index" = "difficulty_index" + 5,
  "difficulty_tier" = CASE
    WHEN ("difficulty_index" + 5) >= 43 THEN 'easy'
    WHEN ("difficulty_index" + 5) >= 37 THEN 'realistic'
    WHEN ("difficulty_index" + 5) >= 31 THEN 'hard'
    WHEN ("difficulty_index" + 5) >= 25 THEN 'elite'
    ELSE 'near_impossible'
  END;
