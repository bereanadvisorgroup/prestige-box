ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "socialMedia" jsonb DEFAULT '[]'::jsonb;
