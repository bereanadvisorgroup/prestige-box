ALTER TABLE users ADD COLUMN IF NOT EXISTS "socialMedia" jsonb DEFAULT '[]'::jsonb;
