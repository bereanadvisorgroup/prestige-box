ALTER TABLE "companies" DROP COLUMN IF EXISTS "clientIds";

CREATE TABLE IF NOT EXISTS "company_owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companyId" uuid NOT NULL,
	"personId" uuid NOT NULL,
	"ownershipPercentage" numeric DEFAULT '0.00' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);

--> statement-breakpoint
ALTER TABLE "company_owners" ADD CONSTRAINT "company_owners_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "company_owners" ADD CONSTRAINT "company_owners_personId_people_id_fk" FOREIGN KEY ("personId") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;

-- RLS Policies
ALTER TABLE "company_owners" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access" ON "company_owners"
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_company_owners_companyId" ON "company_owners" ("companyId");
CREATE INDEX IF NOT EXISTS "idx_company_owners_personId" ON "company_owners" ("personId");