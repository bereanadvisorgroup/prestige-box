CREATE TABLE "asset_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assetId" uuid NOT NULL,
	"value" numeric DEFAULT '0.00' NOT NULL,
	"recordedAt" timestamp with time zone DEFAULT now(),
	"createdAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clientId" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Real Estate and Fixed Physical Assets' NOT NULL,
	"subType" text NOT NULL,
	"currentValue" numeric DEFAULT '0.00' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"isAutomated" boolean DEFAULT false NOT NULL,
	"institutionName" text DEFAULT 'Manual' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE "assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "asset_history" ENABLE ROW LEVEL SECURITY;

-- Create Open Authenticated policies
CREATE POLICY "Allow authenticated full access" ON "assets" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "asset_history" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create Indexes on foreign key columns
CREATE INDEX IF NOT EXISTS "idx_assets_clientId" ON "assets" ("clientId");
CREATE INDEX IF NOT EXISTS "idx_asset_history_assetId" ON "asset_history" ("assetId");
