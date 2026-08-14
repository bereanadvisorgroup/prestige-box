CREATE TABLE IF NOT EXISTS "company_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companyId" uuid NOT NULL,
	"personId" uuid NOT NULL,
	"jobTitle" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);

ALTER TABLE "company_employees" ADD CONSTRAINT "company_employees_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "company_employees" ADD CONSTRAINT "company_employees_personId_people_id_fk" FOREIGN KEY ("personId") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;

-- RLS Policies
ALTER TABLE "company_employees" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access" ON "company_employees"
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_company_employees_companyId" ON "company_employees" ("companyId");
CREATE INDEX IF NOT EXISTS "idx_company_employees_personId" ON "company_employees" ("personId");
