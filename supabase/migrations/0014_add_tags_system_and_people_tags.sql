-- Migration 0014: Add tags system and tags column to people table

-- 1. Create tags table for system-wide reusable tags
CREATE TABLE IF NOT EXISTS "tags" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now(),
    CONSTRAINT "tags_name_unique" UNIQUE("name")
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;

-- 3. Policy for authenticated users
DROP POLICY IF EXISTS "Allow authenticated full access to tags" ON "tags";
CREATE POLICY "Allow authenticated full access to tags"
ON "tags"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Create index on name for quick lookups
CREATE INDEX IF NOT EXISTS "tags_name_idx" ON "tags" ("name");

-- 5. Add tags jsonb array column to people table
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb;

-- 6. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
