-- Alter table clients to support different referral types
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "referredByType" text;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "referredByCompanyId" uuid REFERENCES "companies"("id") ON DELETE SET NULL;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "referredByPersonId" uuid REFERENCES "people"("id") ON DELETE SET NULL;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "referredByReferralTypeId" uuid REFERENCES "referral_types"("id") ON DELETE SET NULL;

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS "clients_referredByCompanyId_idx" ON "clients" ("referredByCompanyId");
CREATE INDEX IF NOT EXISTS "clients_referredByPersonId_idx" ON "clients" ("referredByPersonId");
CREATE INDEX IF NOT EXISTS "clients_referredByReferralTypeId_idx" ON "clients" ("referredByReferralTypeId");

-- Update existing clients to set referredByType = 'client' if referredById is not null
UPDATE "clients" SET "referredByType" = 'client' WHERE "referredById" IS NOT NULL AND "referredByType" IS NULL;
