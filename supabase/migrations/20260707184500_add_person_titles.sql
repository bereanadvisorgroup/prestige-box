-- Add personTitles column to all Professional Services and Vendors tables
ALTER TABLE "life_insurance_companies" ADD COLUMN IF NOT EXISTS "personTitles" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "disability_insurance_companies" ADD COLUMN IF NOT EXISTS "personTitles" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "long_term_care_insurance" ADD COLUMN IF NOT EXISTS "personTitles" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "law_firms" ADD COLUMN IF NOT EXISTS "personTitles" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "accounting_firms" ADD COLUMN IF NOT EXISTS "personTitles" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "actuarial_firms" ADD COLUMN IF NOT EXISTS "personTitles" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "personTitles" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "property_and_casualty_firms" ADD COLUMN IF NOT EXISTS "personTitles" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "money_managers" ADD COLUMN IF NOT EXISTS "personTitles" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "record_keepers" ADD COLUMN IF NOT EXISTS "personTitles" jsonb DEFAULT '{}'::jsonb NOT NULL;
