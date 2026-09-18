-- Migration: Add PrestigeBox Target Fields to Prospects table
-- Prefix, Middle Name, Suffix, Goes By

ALTER TABLE "prospects"
  ADD COLUMN IF NOT EXISTS "notes" text;