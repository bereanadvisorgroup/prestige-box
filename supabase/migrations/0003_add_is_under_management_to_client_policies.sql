ALTER TABLE "client_policies" ADD COLUMN IF NOT EXISTS "isUnderManagement" boolean DEFAULT false NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_client_policies_isUnderManagement" ON "client_policies" ("isUnderManagement");
