-- Create opportunity_pipelines table
CREATE TABLE IF NOT EXISTS "opportunity_pipelines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Create opportunity_pipeline_stages table
CREATE TABLE IF NOT EXISTS "opportunity_pipeline_stages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pipelineId" uuid NOT NULL REFERENCES "opportunity_pipelines"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "order" integer NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Create opportunities table
CREATE TABLE IF NOT EXISTS "opportunities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" uuid REFERENCES "clients"("id") ON DELETE CASCADE,
  "companyId" uuid REFERENCES "companies"("id") ON DELETE CASCADE,
  "amount" numeric NOT NULL DEFAULT '0.00',
  "targetCloseDate" timestamp with time zone,
  "pipelineId" uuid NOT NULL REFERENCES "opportunity_pipelines"("id") ON DELETE RESTRICT,
  "stageId" uuid NOT NULL REFERENCES "opportunity_pipeline_stages"("id") ON DELETE RESTRICT,
  "probabilityWin" integer NOT NULL DEFAULT 0,
  "notes" text,
  "resultStatus" text,
  "resultNotes" text,
  "updatedById" uuid REFERENCES "users"("uid") ON DELETE SET NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE "opportunity_pipelines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "opportunity_pipeline_stages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "opportunities" ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: All authenticated users can read pipelines
DROP POLICY IF EXISTS "Allow authenticated select access" ON "opportunity_pipelines";
CREATE POLICY "Allow authenticated select access"
ON "opportunity_pipelines"
FOR SELECT
TO authenticated
USING (true);

-- 2. Write/Modify Policy: Only administrators can manage pipelines
DROP POLICY IF EXISTS "Allow admin full access to opportunity_pipelines" ON "opportunity_pipelines";
CREATE POLICY "Allow admin full access to opportunity_pipelines"
ON "opportunity_pipelines"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- RLS Policies for opportunity_pipeline_stages
DROP POLICY IF EXISTS "Allow authenticated select access" ON "opportunity_pipeline_stages";
CREATE POLICY "Allow authenticated select access"
ON "opportunity_pipeline_stages"
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow admin full access to opportunity_pipeline_stages" ON "opportunity_pipeline_stages";
CREATE POLICY "Allow admin full access to opportunity_pipeline_stages"
ON "opportunity_pipeline_stages"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- RLS Policies for opportunities: All authenticated users (advisors/admins) have full access
DROP POLICY IF EXISTS "Allow authenticated full access" ON "opportunities";
CREATE POLICY "Allow authenticated full access"
ON "opportunities"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Indexes for performance and RLS
CREATE INDEX IF NOT EXISTS "idx_opportunity_pipeline_stages_pipeline" ON "opportunity_pipeline_stages" ("pipelineId");
CREATE INDEX IF NOT EXISTS "idx_opportunity_pipeline_stages_order" ON "opportunity_pipeline_stages" ("order");
CREATE INDEX IF NOT EXISTS "idx_opportunities_client" ON "opportunities" ("clientId");
CREATE INDEX IF NOT EXISTS "idx_opportunities_company" ON "opportunities" ("companyId");
CREATE INDEX IF NOT EXISTS "idx_opportunities_pipeline" ON "opportunities" ("pipelineId");
CREATE INDEX IF NOT EXISTS "idx_opportunities_stage" ON "opportunities" ("stageId");
CREATE INDEX IF NOT EXISTS "idx_opportunities_updatedBy" ON "opportunities" ("updatedById");
CREATE INDEX IF NOT EXISTS "idx_opportunities_resultStatus" ON "opportunities" ("resultStatus");
