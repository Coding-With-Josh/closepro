-- Add call_date to sales_calls for manual backdating (figures month attribution)
ALTER TABLE "sales_calls"
  ADD COLUMN IF NOT EXISTS "call_date" timestamp with time zone;
