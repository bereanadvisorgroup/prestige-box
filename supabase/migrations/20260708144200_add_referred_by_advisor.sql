-- Alter table clients to support advisor referrals
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "referredByAdvisorId" uuid REFERENCES "users"("uid") ON DELETE SET NULL;

-- Create index for the foreign key column to optimize RLS queries
CREATE INDEX IF NOT EXISTS "clients_referredByAdvisorId_idx" ON "clients" ("referredByAdvisorId");
