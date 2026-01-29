-- Quick fix: Add missing columns to offers table
-- Run this directly in your PostgreSQL client (psql, pgAdmin, etc.)

-- Add core_offer_price column
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "core_offer_price" text;

-- Add other missing columns if needed
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "customer_stage" customer_stage;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "core_problems" text;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "desired_outcome" text;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "tangible_outcomes" text;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "emotional_outcomes" text;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "deliverables" text;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "time_per_week" text;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "estimated_time_to_results" text;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "case_study_strength" case_study_strength;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "guarantees_refund_terms" text;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "primary_funnel_source" primary_funnel_source;
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "funnel_context_additional" text;

-- Create enums if they don't exist
DO $$ BEGIN
  CREATE TYPE customer_stage AS ENUM ('aspiring', 'current', 'mixed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE case_study_strength AS ENUM ('none', 'weak', 'moderate', 'strong');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE primary_funnel_source AS ENUM ('cold_outbound', 'cold_ads', 'warm_inbound', 'content_driven_inbound', 'referral', 'existing_customer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
