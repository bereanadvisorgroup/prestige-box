-- Migration: 0023_add_address_to_assets
-- Add optional addressId column to assets table for real estate address linking

ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "addressId" uuid;

CREATE INDEX IF NOT EXISTS "idx_assets_addressId" ON "assets" ("addressId");
