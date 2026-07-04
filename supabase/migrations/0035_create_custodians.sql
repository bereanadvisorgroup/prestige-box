-- Create custodians table
CREATE TABLE IF NOT EXISTS "custodians" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE "custodians" ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: All authenticated users can read custodians
DROP POLICY IF EXISTS "Allow authenticated select access" ON "custodians";
CREATE POLICY "Allow authenticated select access"
ON "custodians"
FOR SELECT
TO authenticated
USING (true);

-- 2. Write/Modify Policy: Only administrators can create, update, or delete records
DROP POLICY IF EXISTS "Allow admin full access to custodians" ON "custodians";
CREATE POLICY "Allow admin full access to custodians"
ON "custodians"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Seed initial alphabetical values
INSERT INTO "custodians" ("name") VALUES
  ('Axos'),
  ('Dunham'),
  ('PCS'),
  ('Schwab')
ON CONFLICT ("name") DO NOTHING;
