CREATE TABLE IF NOT EXISTS "company_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companyId" uuid NOT NULL,
	"personId" uuid NOT NULL,
	"jobTitle" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);

-- Foreign Key Constraints with IF NOT EXISTS checks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_employees_companyId_companies_id_fk'
  ) THEN
    ALTER TABLE "company_employees" ADD CONSTRAINT "company_employees_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_employees_personId_people_id_fk'
  ) THEN
    ALTER TABLE "company_employees" ADD CONSTRAINT "company_employees_personId_people_id_fk" FOREIGN KEY ("personId") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

-- RLS Policies
ALTER TABLE "company_employees" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'company_employees' AND policyname = 'Allow authenticated full access'
  ) THEN
    CREATE POLICY "Allow authenticated full access" ON "company_employees"
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_company_employees_companyId" ON "company_employees" ("companyId");
CREATE INDEX IF NOT EXISTS "idx_company_employees_personId" ON "company_employees" ("personId");

-- Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
