ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "moneyManagerAccounts" jsonb DEFAULT '[]'::jsonb;
