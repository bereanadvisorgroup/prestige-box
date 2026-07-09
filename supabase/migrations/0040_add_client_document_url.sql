-- Add documentUrl column to clients table
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "documentUrl" text;
