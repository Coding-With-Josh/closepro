-- Quick fix: Add core_offer_price column if it doesn't exist
ALTER TABLE "offers"
  ADD COLUMN IF NOT EXISTS "core_offer_price" text;
