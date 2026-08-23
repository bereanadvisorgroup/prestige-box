-- Migration: Add goesBy column to people table
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "goesBy" text;

-- Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
