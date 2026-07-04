ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "lifePolicies" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "disabilityPolicies" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "ltcPolicies" jsonb DEFAULT '[]'::jsonb;
