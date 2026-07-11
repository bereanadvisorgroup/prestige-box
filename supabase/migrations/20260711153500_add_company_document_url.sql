-- Add documentUrl column to companies table
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "documentUrl" text;
