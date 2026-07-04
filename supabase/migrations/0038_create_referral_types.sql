-- Create referral_types table
CREATE TABLE IF NOT EXISTS "referral_types" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE "referral_types" ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: All authenticated users can read referral types
DROP POLICY IF EXISTS "Allow authenticated select access" ON "referral_types";
CREATE POLICY "Allow authenticated select access"
ON "referral_types"
FOR SELECT
TO authenticated
USING (true);

-- 2. Write/Modify Policy: Only administrators can create, update, or delete records
DROP POLICY IF EXISTS "Allow admin full access to referral_types" ON "referral_types";
CREATE POLICY "Allow admin full access to referral_types"
ON "referral_types"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Seed initial alphabetical values
INSERT INTO "referral_types" ("name") VALUES
  ('Advisor Referral'),
  ('Cold Call'),
  ('Digital'),
  ('Direct Mail'),
  ('Employee'),
  ('HNWL - Pac Life'),
  ('John Cannon'),
  ('Lead - Clark'),
  ('Lee Wetherington Homes'),
  ('Other'),
  ('Retirement Plan')
ON CONFLICT ("name") DO NOTHING;
