-- Migration 0022: Add actions column to tasks table
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "actions" jsonb DEFAULT '[]'::jsonb;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
