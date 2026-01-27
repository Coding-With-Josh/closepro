-- Migration: Add offer_id to prospect_avatars table and make prospects offer-scoped
-- This enforces the offer-centric architecture where all prospects belong to offers

-- Step 1: Add offer_id column (temporarily nullable for migration)
ALTER TABLE "prospect_avatars" 
ADD COLUMN "offer_id" uuid REFERENCES "offers"("id") ON DELETE CASCADE;

-- Step 2: Delete all existing global avatars (clean slate - they have no offer context)
DELETE FROM "prospect_avatars";

-- Step 3: Make offer_id required (NOT NULL)
ALTER TABLE "prospect_avatars" 
ALTER COLUMN "offer_id" SET NOT NULL;

-- Step 4: Add index for faster lookups
CREATE INDEX IF NOT EXISTS "prospect_avatars_offer_id_idx" ON "prospect_avatars"("offer_id");
