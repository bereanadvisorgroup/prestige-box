ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "logoUrl" text;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "socialMedia" jsonb DEFAULT '[]'::jsonb;
