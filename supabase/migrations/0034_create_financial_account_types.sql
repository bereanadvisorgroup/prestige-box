-- Create financial_account_types table
CREATE TABLE IF NOT EXISTS "financial_account_types" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE "financial_account_types" ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: All authenticated users can read account types
DROP POLICY IF EXISTS "Allow authenticated select access" ON "financial_account_types";
CREATE POLICY "Allow authenticated select access"
ON "financial_account_types"
FOR SELECT
TO authenticated
USING (true);

-- 2. Write/Modify Policy: Only administrators can create, update, or delete records
DROP POLICY IF EXISTS "Allow admin full access to financial_account_types" ON "financial_account_types";
CREATE POLICY "Allow admin full access to financial_account_types"
ON "financial_account_types"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Seed initial alphabetical values
INSERT INTO "financial_account_types" ("name") VALUES
  ('Corporate Account'),
  ('Defined Benefit Account'),
  ('Individual Account'),
  ('IRA'),
  ('Joint Account / JTWROS'),
  ('Profit Sharing Account'),
  ('ROTH IRA'),
  ('Solo 401K'),
  ('TrustAccount')
ON CONFLICT ("name") DO NOTHING;
