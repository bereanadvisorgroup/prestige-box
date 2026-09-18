-- Migration: Add Address fields to Prospects table

ALTER TABLE "prospects"
  ADD COLUMN IF NOT EXISTS "street" text,
  ADD COLUMN IF NOT EXISTS "street2" text,
  ADD COLUMN IF NOT EXISTS "city" text,
  ADD COLUMN IF NOT EXISTS "state" text,
  ADD COLUMN IF NOT EXISTS "zip" text;
