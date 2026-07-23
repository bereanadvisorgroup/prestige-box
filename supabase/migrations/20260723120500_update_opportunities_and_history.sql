-- Add closeDate column to opportunities
ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "closeDate" timestamp with time zone;

-- Create opportunity_history table
CREATE TABLE IF NOT EXISTS "opportunity_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "opportunityId" uuid NOT NULL REFERENCES "opportunities"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "oldValue" text,
  "newValue" text,
  "reason" text,
  "actorId" uuid REFERENCES "users"("uid") ON DELETE SET NULL,
  "actorName" text NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE "opportunity_history" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow authenticated select access to opportunity_history" ON "opportunity_history";
CREATE POLICY "Allow authenticated select access to opportunity_history"
ON "opportunity_history"
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert access to opportunity_history" ON "opportunity_history";
CREATE POLICY "Allow authenticated insert access to opportunity_history"
ON "opportunity_history"
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update access to opportunity_history" ON "opportunity_history";
CREATE POLICY "Allow authenticated update access to opportunity_history"
ON "opportunity_history"
FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete access to opportunity_history" ON "opportunity_history";
CREATE POLICY "Allow authenticated delete access to opportunity_history"
ON "opportunity_history"
FOR DELETE
TO authenticated
USING (true);

-- Indexes for performance and foreign key columns targeted by RLS
CREATE INDEX IF NOT EXISTS "idx_opportunity_history_opportunity_id" ON "opportunity_history" ("opportunityId");
CREATE INDEX IF NOT EXISTS "idx_opportunity_history_actor_id" ON "opportunity_history" ("actorId");
