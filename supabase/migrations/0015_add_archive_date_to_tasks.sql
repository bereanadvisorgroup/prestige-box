-- Migration: Add archiveDate column to tasks table
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "archiveDate" timestamp with time zone;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
