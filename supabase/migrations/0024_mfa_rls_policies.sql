-- Migration: Enforce AAL2 (MFA) on financial and asset tables

-- 1. Secure Assets and Asset History tables
DROP POLICY IF EXISTS "Allow authenticated full access" ON "assets";
DROP POLICY IF EXISTS "Allow authenticated full access" ON "asset_history";

CREATE POLICY "Allow authenticated AAL2 access to assets" ON "assets"
FOR ALL TO authenticated
USING (((SELECT auth.jwt() ->> 'aal') = 'aal2'))
WITH CHECK (((SELECT auth.jwt() ->> 'aal') = 'aal2'));

CREATE POLICY "Allow authenticated AAL2 access to asset_history" ON "asset_history"
FOR ALL TO authenticated
USING (((SELECT auth.jwt() ->> 'aal') = 'aal2'))
WITH CHECK (((SELECT auth.jwt() ->> 'aal') = 'aal2'));


-- 2. Secure Financial Data table (template / example table)
CREATE TABLE IF NOT EXISTS "financial_data" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL,
  "amount" numeric DEFAULT '0.00' NOT NULL,
  "description" text,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

ALTER TABLE "financial_data" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enforce AAL2 for financial_data" ON "financial_data";

CREATE POLICY "Enforce AAL2 for financial_data" ON "financial_data"
FOR ALL TO authenticated
USING (((SELECT auth.jwt() ->> 'aal') = 'aal2'))
WITH CHECK (((SELECT auth.jwt() ->> 'aal') = 'aal2'));

-- Create index on userId foreign key column for optimized RLS performance
CREATE INDEX IF NOT EXISTS "idx_financial_data_userId" ON "financial_data" ("userId");
