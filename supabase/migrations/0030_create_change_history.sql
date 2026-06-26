CREATE TABLE "change_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entityType" text NOT NULL,
	"entityId" uuid NOT NULL,
	"subType" text NOT NULL,
	"action" text NOT NULL,
	"fieldName" text,
	"fieldLabel" text,
	"oldValue" text,
	"newValue" text,
	"summary" text,
	"actorId" uuid,
	"actorName" text,
	"changedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE "change_history" ENABLE ROW LEVEL SECURITY;

-- Create Open Authenticated policy (mirrors existing tables)
CREATE POLICY "Allow authenticated full access" ON "change_history" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes: per-entity history sorted by date, and a global date index for the report view
CREATE INDEX IF NOT EXISTS "idx_change_history_entity" ON "change_history" ("entityType", "entityId", "changedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_change_history_changedAt" ON "change_history" ("changedAt" DESC);
