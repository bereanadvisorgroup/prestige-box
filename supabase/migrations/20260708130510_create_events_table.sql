-- Create events table
CREATE TABLE IF NOT EXISTS "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "addressId" uuid REFERENCES "addresses"("id") ON DELETE SET NULL,
  "startDate" timestamp with time zone,
  "endDate" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: All authenticated users can read events
DROP POLICY IF EXISTS "Allow authenticated select access" ON "events";
CREATE POLICY "Allow authenticated select access"
ON "events"
FOR SELECT
TO authenticated
USING (true);

-- 2. Write/Modify Policy: Only administrators can create, update, or delete records
DROP POLICY IF EXISTS "Allow admin full access to events" ON "events";
CREATE POLICY "Allow admin full access to events"
ON "events"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Alter table clients to support event referrals
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "referredByEventId" uuid REFERENCES "events"("id") ON DELETE SET NULL;

-- Create index for the foreign key column to optimize RLS queries
CREATE INDEX IF NOT EXISTS "clients_referredByEventId_idx" ON "clients" ("referredByEventId");
