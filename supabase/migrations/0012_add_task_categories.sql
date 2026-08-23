-- Migration: Create task_categories table with RLS and initial seeded categories
CREATE TABLE IF NOT EXISTS "task_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE "task_categories" ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: All authenticated users can read task categories
DROP POLICY IF EXISTS "Allow authenticated select access" ON "task_categories";
CREATE POLICY "Allow authenticated select access"
ON "task_categories"
FOR SELECT
TO authenticated
USING (true);

-- 2. Write/Modify Policy: Only administrators can create, update, or delete records
DROP POLICY IF EXISTS "Allow admin full access to task_categories" ON "task_categories";
CREATE POLICY "Allow admin full access to task_categories"
ON "task_categories"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Seed initial values (hard-coded categories currently in the system)
INSERT INTO "task_categories" ("name") VALUES
  ('Other'),
  ('Birthday'),
  ('Wedding Anniversary'),
  ('Policy Renewal')
ON CONFLICT ("name") DO NOTHING;

-- Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
