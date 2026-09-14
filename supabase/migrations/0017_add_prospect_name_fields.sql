-- Migration: Add PrestigeBox Target Fields to Prospects table
-- Prefix, Middle Name, Suffix, Goes By

ALTER TABLE "prospects"
  ADD COLUMN IF NOT EXISTS "prefix" text,
  ADD COLUMN IF NOT EXISTS "middleName" text,
  ADD COLUMN IF NOT EXISTS "suffix" text,
  ADD COLUMN IF NOT EXISTS "goesBy" text;
