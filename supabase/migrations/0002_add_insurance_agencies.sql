CREATE TABLE IF NOT EXISTS "insurance_agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personIds" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"personTitles" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"firmName" text NOT NULL,
	"firmAddressId" uuid,
	"website" text,
	"phone" text,
	"clientIds" uuid[] DEFAULT '{}'::uuid[],
	"companyIds" uuid[] DEFAULT '{}'::uuid[],
	"logoUrl" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);

ALTER TABLE "insurance_agencies" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'insurance_agencies' 
        AND policyname = 'Allow authenticated full access'
    ) THEN
        CREATE POLICY "Allow authenticated full access" ON "insurance_agencies" FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_insurance_agencies_firmAddressId" ON "insurance_agencies" ("firmAddressId");
