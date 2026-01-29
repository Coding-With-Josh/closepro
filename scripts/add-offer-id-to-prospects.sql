-- Quick fix: Add offer_id column to prospect_avatars table
-- This migration adds the offer_id column that's needed for the offers API

-- Step 1: Add offer_id column (nullable first for existing data)
ALTER TABLE "prospect_avatars"
ADD COLUMN IF NOT EXISTS "offer_id" uuid REFERENCES "offers"("id") ON DELETE CASCADE;

-- Step 2: For existing prospects without an offer, you may need to assign them to a default offer
-- This is a data migration - update existing rows if needed
-- UPDATE "prospect_avatars" SET "offer_id" = (SELECT id FROM "offers" LIMIT 1) WHERE "offer_id" IS NULL;

-- Step 3: Make offer_id required (NOT NULL) - only do this after all rows have offer_id
-- ALTER TABLE "prospect_avatars" ALTER COLUMN "offer_id" SET NOT NULL;

-- Step 4: Create index for faster lookups
CREATE INDEX IF NOT EXISTS "prospect_avatars_offer_id_idx" ON "prospect_avatars"("offer_id");
