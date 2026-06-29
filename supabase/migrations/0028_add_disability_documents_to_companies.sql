ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "disabilityDocuments" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "ltcDocuments" jsonb DEFAULT '[]'::jsonb;
