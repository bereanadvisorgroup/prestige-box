-- Migration: Add documentUrl and notebookUrl columns to households and people tables
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "documentUrl" text;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "notebookUrl" text;

ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "documentUrl" text;
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "notebookUrl" text;

-- Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
