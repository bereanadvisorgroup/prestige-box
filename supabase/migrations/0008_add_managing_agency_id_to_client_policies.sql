ALTER TABLE "client_policies" ADD COLUMN IF NOT EXISTS "managingAgencyId" uuid;
CREATE INDEX IF NOT EXISTS "idx_client_policies_managingAgencyId" ON "client_policies" ("managingAgencyId");
