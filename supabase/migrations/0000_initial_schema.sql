-- ==============================================================================
-- PRESTIGE BOX PRODUCTION CONSOLIDATED INITIAL SCHEMA MIGRATION
-- Generated: 2026-08-01T19:28:02.243Z
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Migration 1/64: 0000_loud_falcon.sql
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "accountants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personId" uuid NOT NULL,
	"firmName" text NOT NULL,
	"firmAddressId" uuid,
	"clientIds" uuid[] DEFAULT '{}'::uuid[],
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"street1" text NOT NULL,
	"street2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zipCode" text NOT NULL,
	"country" text DEFAULT 'USA',
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clientId" uuid NOT NULL,
	"insuranceCompanyId" uuid NOT NULL,
	"paymentAccountId" text,
	"policyName" text NOT NULL,
	"policyNumber" text NOT NULL,
	"premiumAmount" numeric DEFAULT '0.00' NOT NULL,
	"effectiveDate" timestamp with time zone NOT NULL,
	"renewalDate" timestamp with time zone NOT NULL,
	"paymentSchedule" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personId" uuid NOT NULL,
	"hobbies" text[] DEFAULT '{}'::text[],
	"favoriteSportsTeams" text[] DEFAULT '{}'::text[],
	"paymentAccounts" jsonb DEFAULT '[]'::jsonb,
	"familyMembers" jsonb DEFAULT '[]'::jsonb,
	"employments" jsonb DEFAULT '[]'::jsonb,
	"pcDocuments" jsonb DEFAULT '[]'::jsonb,
	"lifeDocuments" jsonb DEFAULT '[]'::jsonb,
	"estateDocuments" jsonb DEFAULT '[]'::jsonb,
	"liabilities" jsonb DEFAULT '[]'::jsonb,
	"mortgages" jsonb DEFAULT '[]'::jsonb,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"dba" text,
	"ein" text,
	"addressId" uuid,
	"website" text,
	"phone" text,
	"clientIds" uuid[] DEFAULT '{}'::uuid[],
	"situsRecords" jsonb DEFAULT '[]'::jsonb,
	"nexusRecords" jsonb DEFAULT '[]'::jsonb,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"addressId" uuid,
	"memberIds" jsonb DEFAULT '[]'::jsonb,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "insurance_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"websiteUrl" text NOT NULL,
	"policyNames" text[] DEFAULT '{}'::text[],
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lawyers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personId" uuid NOT NULL,
	"firmName" text NOT NULL,
	"firmAddressId" uuid,
	"clientIds" uuid[] DEFAULT '{}'::uuid[],
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prefix" text,
	"firstName" text NOT NULL,
	"middleName" text,
	"lastName" text NOT NULL,
	"suffix" text,
	"emails" jsonb DEFAULT '[]'::jsonb,
	"phones" jsonb DEFAULT '[]'::jsonb,
	"driversLicense" jsonb DEFAULT '{}'::jsonb,
	"pii" jsonb DEFAULT '{}'::jsonb,
	"addresses" jsonb DEFAULT '[]'::jsonb,
	"addressIds" uuid[] DEFAULT '{}'::uuid[],
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"uid" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"firstName" text,
	"lastName" text,
	"role" text DEFAULT 'client' NOT NULL,
	"photoURL" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- ------------------------------------------------------------------------------
-- Migration 2/64: 0001_chilly_thing.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "people" ADD COLUMN "photoUrl" text;

-- ------------------------------------------------------------------------------
-- Migration 3/64: 0002_fair_killraven.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "lawyers" DROP COLUMN "personId";

-- ------------------------------------------------------------------------------
-- Migration 4/64: 0003_third_kingpin.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "lawyers" ADD COLUMN "personIds" uuid[] DEFAULT '{}'::uuid[] NOT NULL;

-- ------------------------------------------------------------------------------
-- Migration 5/64: 0004_mature_ben_urich.sql
-- ------------------------------------------------------------------------------

DROP TABLE "lawyers" CASCADE;

-- ------------------------------------------------------------------------------
-- Migration 6/64: 0005_past_cassandra_nova.sql
-- ------------------------------------------------------------------------------

CREATE TABLE "law_firms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personIds" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"firmName" text NOT NULL,
	"firmAddressId" uuid,
	"clientIds" uuid[] DEFAULT '{}'::uuid[],
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- Migration 7/64: 0006_ancient_winter_soldier.sql
-- ------------------------------------------------------------------------------

CREATE TABLE "accounting_firms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personIds" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"firmName" text NOT NULL,
	"firmAddressId" uuid,
	"clientIds" uuid[] DEFAULT '{}'::uuid[],
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- Migration 8/64: 0007_concerned_prodigy.sql
-- ------------------------------------------------------------------------------

DROP TABLE "accountants" CASCADE;

-- ------------------------------------------------------------------------------
-- Migration 9/64: 0008_needy_betty_brant.sql
-- ------------------------------------------------------------------------------

CREATE TABLE "actuarial_firms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personIds" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"firmName" text NOT NULL,
	"firmAddressId" uuid,
	"clientIds" uuid[] DEFAULT '{}'::uuid[],
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personIds" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"firmName" text NOT NULL,
	"firmAddressId" uuid,
	"clientIds" uuid[] DEFAULT '{}'::uuid[],
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_and_casualty_firms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personIds" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"firmName" text NOT NULL,
	"firmAddressId" uuid,
	"clientIds" uuid[] DEFAULT '{}'::uuid[],
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- Migration 10/64: 0009_dapper_storm.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "accounting_firms" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "actuarial_firms" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "banks" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "law_firms" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "property_and_casualty_firms" ADD COLUMN "website" text;

-- ------------------------------------------------------------------------------
-- Migration 11/64: 0010_fine_black_crow.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "accounting_firms" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "actuarial_firms" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "banks" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "law_firms" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "property_and_casualty_firms" ADD COLUMN "phone" text;

-- ------------------------------------------------------------------------------
-- Migration 12/64: 0011_rename_insurance_to_life.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "insurance_companies" RENAME TO "life_insurance_companies";--> statement-breakpoint
ALTER TABLE "client_policies" RENAME COLUMN "insuranceCompanyId" TO "lifeInsuranceCompanyId";

-- ------------------------------------------------------------------------------
-- Migration 13/64: 0012_add_phone_and_people_to_life_insurance.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "life_insurance_companies" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "life_insurance_companies" ADD COLUMN "personIds" uuid[] DEFAULT '{}'::uuid[] NOT NULL;

-- ------------------------------------------------------------------------------
-- Migration 14/64: 0013_careless_amphibian.sql
-- ------------------------------------------------------------------------------

CREATE TABLE "disability_insurance_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"websiteUrl" text NOT NULL,
	"policyNames" text[] DEFAULT '{}'::text[],
	"phone" text,
	"personIds" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "client_policies" ALTER COLUMN "lifeInsuranceCompanyId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "client_policies" ADD COLUMN "disabilityInsuranceCompanyId" uuid;

-- ------------------------------------------------------------------------------
-- Migration 15/64: 0014_long_susan_delgado.sql
-- ------------------------------------------------------------------------------

CREATE TABLE "long_term_care_insurance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"websiteUrl" text NOT NULL,
	"policyNames" text[] DEFAULT '{}'::text[],
	"phone" text,
	"personIds" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "client_policies" ADD COLUMN "longTermCareInsuranceId" uuid;

-- ------------------------------------------------------------------------------
-- Migration 16/64: 0015_stale_ogun.sql
-- ------------------------------------------------------------------------------

CREATE TABLE "money_managers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personIds" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"firmName" text NOT NULL,
	"firmAddressId" uuid,
	"website" text,
	"phone" text,
	"clientIds" uuid[] DEFAULT '{}'::uuid[],
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- Migration 17/64: 0016_salty_lord_hawal.sql
-- ------------------------------------------------------------------------------

CREATE TABLE "record_keepers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personIds" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"firmName" text NOT NULL,
	"firmAddressId" uuid,
	"website" text,
	"phone" text,
	"clientIds" uuid[] DEFAULT '{}'::uuid[],
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- Migration 18/64: 0017_lying_zeigeist.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "clients" ADD COLUMN "referredById" uuid;

-- ------------------------------------------------------------------------------
-- Migration 19/64: 0018_green_ikaris.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "accounting_firms" ADD COLUMN "companyIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "actuarial_firms" ADD COLUMN "companyIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "banks" ADD COLUMN "companyIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "disability_insurance_companies" ADD COLUMN "companyIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "law_firms" ADD COLUMN "companyIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "life_insurance_companies" ADD COLUMN "companyIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "long_term_care_insurance" ADD COLUMN "companyIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "money_managers" ADD COLUMN "companyIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "property_and_casualty_firms" ADD COLUMN "companyIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "record_keepers" ADD COLUMN "companyIds" uuid[] DEFAULT '{}'::uuid[];

-- ------------------------------------------------------------------------------
-- Migration 20/64: 0019_create_avatars_bucket.sql
-- ------------------------------------------------------------------------------

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Ensure RLS is enabled on storage.objects
-- (Removed because ALTER TABLE on storage.objects is not permitted and RLS is already managed)

-- Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Allow public read-only access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their avatars" ON storage.objects;

-- Create policies
CREATE POLICY "Allow public read-only access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND (
    (select auth.uid()::text) = (storage.foldername(name))[1] OR
    (select role from public.users where uid = auth.uid()) = 'admin'
  )
);

CREATE POLICY "Allow authenticated users to update their avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND (
    (select auth.uid()::text) = (storage.foldername(name))[1] OR
    (select role from public.users where uid = auth.uid()) = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND (
    (select auth.uid()::text) = (storage.foldername(name))[1] OR
    (select role from public.users where uid = auth.uid()) = 'admin'
  )
);

CREATE POLICY "Allow authenticated users to delete their avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND (
    (select auth.uid()::text) = (storage.foldername(name))[1] OR
    (select role from public.users where uid = auth.uid()) = 'admin'
  )
);

-- ------------------------------------------------------------------------------
-- Migration 21/64: 0020_dazzling_mojo.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "clients" ADD COLUMN "ltcDocuments" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "disability_insurance_companies" ADD COLUMN "clientIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "life_insurance_companies" ADD COLUMN "clientIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "long_term_care_insurance" ADD COLUMN "clientIds" uuid[] DEFAULT '{}'::uuid[];

-- ------------------------------------------------------------------------------
-- Migration 22/64: 0020_enable_rls_all_tables.sql
-- ------------------------------------------------------------------------------

-- Migration: Enable RLS and setup Open Authenticated policies

-- 1. Enable RLS on all active application tables
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "banks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "households" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "people" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "law_firms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounting_firms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "actuarial_firms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "property_and_casualty_firms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "life_insurance_companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "disability_insurance_companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "long_term_care_insurance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "money_managers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "record_keepers" ENABLE ROW LEVEL SECURITY;

-- 2. Create Open Authenticated policies for each table
DO $$
DECLARE
    table_name text;
    tables text[] := ARRAY[
        'addresses', 'banks', 'client_policies', 'clients', 'companies',
        'households', 'people', 'users', 'law_firms', 'accounting_firms',
        'actuarial_firms', 'property_and_casualty_firms', 'life_insurance_companies',
        'disability_insurance_companies', 'long_term_care_insurance',
        'money_managers', 'record_keepers'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('CREATE POLICY "Allow authenticated full access" ON "%I" FOR ALL TO authenticated USING (true) WITH CHECK (true);', table_name);
    END LOOP;
END $$;

-- 3. Fix raw auth.uid() calls in storage policies (0001_create_avatars_bucket.sql)
DROP POLICY IF EXISTS "Allow public read-only access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete an avatar." ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible." 
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar." 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
    bucket_id = 'avatars' AND 
    (
        owner_id = (SELECT auth.uid()::text) OR
        (storage.foldername(name))[1] = (SELECT auth.uid()::text) OR
        EXISTS (SELECT 1 FROM public.users WHERE uid = (SELECT auth.uid()) AND role = 'admin')
    )
);

CREATE POLICY "Anyone can update an avatar." 
ON storage.objects FOR UPDATE TO authenticated 
USING (
    bucket_id = 'avatars' AND 
    (
        owner_id = (SELECT auth.uid()::text) OR
        (storage.foldername(name))[1] = (SELECT auth.uid()::text) OR
        EXISTS (SELECT 1 FROM public.users WHERE uid = (SELECT auth.uid()) AND role = 'admin')
    )
);

CREATE POLICY "Anyone can delete an avatar." 
ON storage.objects FOR DELETE TO authenticated 
USING (
    bucket_id = 'avatars' AND 
    (
        owner_id = (SELECT auth.uid()::text) OR
        (storage.foldername(name))[1] = (SELECT auth.uid()::text) OR
        EXISTS (SELECT 1 FROM public.users WHERE uid = (SELECT auth.uid()) AND role = 'admin')
    )
);

-- 4. Create Indexes on common query fields
-- Wait, accountants and lawyers tables were dropped according to the subagent. I'll omit them.
CREATE INDEX IF NOT EXISTS "idx_client_policies_clientId" ON "client_policies" ("clientId");
CREATE INDEX IF NOT EXISTS "idx_client_policies_lifeInsuranceCompanyId" ON "client_policies" ("lifeInsuranceCompanyId");
CREATE INDEX IF NOT EXISTS "idx_clients_personId" ON "clients" ("personId");
CREATE INDEX IF NOT EXISTS "idx_companies_addressId" ON "companies" ("addressId");
CREATE INDEX IF NOT EXISTS "idx_households_addressId" ON "households" ("addressId");
CREATE INDEX IF NOT EXISTS "idx_law_firms_firmAddressId" ON "law_firms" ("firmAddressId");
CREATE INDEX IF NOT EXISTS "idx_accounting_firms_firmAddressId" ON "accounting_firms" ("firmAddressId");
CREATE INDEX IF NOT EXISTS "idx_actuarial_firms_firmAddressId" ON "actuarial_firms" ("firmAddressId");
CREATE INDEX IF NOT EXISTS "idx_banks_firmAddressId" ON "banks" ("firmAddressId");
CREATE INDEX IF NOT EXISTS "idx_property_and_casualty_firms_firmAddressId" ON "property_and_casualty_firms" ("firmAddressId");

-- ------------------------------------------------------------------------------
-- Migration 23/64: 0021_adorable_chronomancer.sql
-- ------------------------------------------------------------------------------

CREATE TABLE "company_valuation_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companyId" uuid NOT NULL,
	"value" numeric DEFAULT '0.00' NOT NULL,
	"valuationDate" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "keyvals" (
	"id" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "ltcDocuments" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "estimatedValue" numeric DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "disability_insurance_companies" ADD COLUMN "clientIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "life_insurance_companies" ADD COLUMN "clientIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "long_term_care_insurance" ADD COLUMN "clientIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "company_valuation_history" ADD CONSTRAINT "company_valuation_history_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;

-- ------------------------------------------------------------------------------
-- Migration 24/64: 0021_create_documents_bucket.sql
-- ------------------------------------------------------------------------------

-- Create the documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Documents are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload a document" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update a document" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete a document" ON storage.objects;

-- Create policies for the documents bucket
CREATE POLICY "Documents are publicly accessible" 
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'documents');

CREATE POLICY "Anyone can upload a document" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
    bucket_id = 'documents'
);

CREATE POLICY "Anyone can update a document" 
ON storage.objects FOR UPDATE TO authenticated 
USING (
    bucket_id = 'documents'
);

CREATE POLICY "Anyone can delete a document" 
ON storage.objects FOR DELETE TO authenticated 
USING (
    bucket_id = 'documents'
);

-- ------------------------------------------------------------------------------
-- Migration 25/64: 0022_create_assets_tables.sql
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- Migration 26/64: 0022_remove_clients_add_owners.sql
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- Migration 27/64: 0023_add_address_to_assets.sql
-- ------------------------------------------------------------------------------

-- Migration: 0023_add_address_to_assets
-- Add optional addressId column to assets table for real estate address linking

ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "addressId" uuid;

CREATE INDEX IF NOT EXISTS "idx_assets_addressId" ON "assets" ("addressId");

-- ------------------------------------------------------------------------------
-- Migration 28/64: 0024_mfa_rls_policies.sql
-- ------------------------------------------------------------------------------

-- Migration: Enforce AAL2 (MFA) on financial and asset tables

-- 1. Secure Assets and Asset History tables
DROP POLICY IF EXISTS "Allow authenticated full access" ON "assets";
DROP POLICY IF EXISTS "Allow authenticated full access" ON "asset_history";

CREATE POLICY "Allow authenticated AAL2 access to assets" ON "assets"
FOR ALL TO authenticated
USING (((SELECT auth.jwt() ->> 'aal') = 'aal2'))
WITH CHECK (((SELECT auth.jwt() ->> 'aal') = 'aal2'));

CREATE POLICY "Allow authenticated AAL2 access to asset_history" ON "asset_history"
FOR ALL TO authenticated
USING (((SELECT auth.jwt() ->> 'aal') = 'aal2'))
WITH CHECK (((SELECT auth.jwt() ->> 'aal') = 'aal2'));


-- 2. Secure Financial Data table (template / example table)
CREATE TABLE IF NOT EXISTS "financial_data" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL,
  "amount" numeric DEFAULT '0.00' NOT NULL,
  "description" text,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

ALTER TABLE "financial_data" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enforce AAL2 for financial_data" ON "financial_data";

CREATE POLICY "Enforce AAL2 for financial_data" ON "financial_data"
FOR ALL TO authenticated
USING (((SELECT auth.jwt() ->> 'aal') = 'aal2'))
WITH CHECK (((SELECT auth.jwt() ->> 'aal') = 'aal2'));

-- Create index on userId foreign key column for optimized RLS performance
CREATE INDEX IF NOT EXISTS "idx_financial_data_userId" ON "financial_data" ("userId");

-- ------------------------------------------------------------------------------
-- Migration 29/64: 0025_restrict_auth_signup_and_settings.sql
-- ------------------------------------------------------------------------------

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already exists in public.users by email
  IF EXISTS (
    SELECT 1 FROM public.users WHERE email = NEW.email
  ) THEN
    -- Update the existing profile's uid and other metadata
    UPDATE public.users
    SET 
      uid = NEW.id,
      "firstName" = COALESCE(NEW.raw_user_meta_data->>'firstName', "firstName", ''),
      "lastName" = COALESCE(NEW.raw_user_meta_data->>'lastName', "lastName", ''),
      role = COALESCE(NEW.raw_user_meta_data->>'role', role, 'client'),
      "updatedAt" = now()
    WHERE email = NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Drop users_uid_fkey foreign key constraint to prevent registration deadlock
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_uid_fkey;

-- Create keyvals table
CREATE TABLE IF NOT EXISTS "keyvals" (
  "id" text PRIMARY KEY NOT NULL,
  "value" text NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE "keyvals" ENABLE ROW LEVEL SECURITY;

-- Policies for keyvals
DROP POLICY IF EXISTS "Allow public read access to keyvals" ON "keyvals";
CREATE POLICY "Allow public read access to keyvals" 
ON "keyvals" 
FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow admin full access to keyvals" ON "keyvals";
CREATE POLICY "Allow admin full access to keyvals" 
ON "keyvals" 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Seed default contact settings
INSERT INTO "keyvals" ("id", "value") VALUES
  ('BUSINESS_EMAIL', 'info@prestigeadvisors360.com'),
  ('BUSINESS_PHONE', '941-799-3300')
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------------------------
-- Migration 30/64: 0026_add_payment_accounts_to_companies.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "companies" ADD COLUMN "paymentAccounts" jsonb DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------------------------
-- Migration 31/64: 0027_add_life_documents_to_companies.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "companies" ADD COLUMN "lifeDocuments" jsonb DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------------------------
-- Migration 32/64: 0028_add_disability_documents_to_companies.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "disabilityDocuments" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "ltcDocuments" jsonb DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------------------------
-- Migration 33/64: 0029_add_ltc_documents_to_companies.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "companies" ADD COLUMN "ltcDocuments" jsonb DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------------------------
-- Migration 34/64: 0030_create_change_history.sql
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- Migration 35/64: 0031_create_tasks.sql
-- ------------------------------------------------------------------------------

-- Task management: tasks + assignees + associations, plus clients.advisorId

CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL DEFAULT 'New',
	"category" text NOT NULL DEFAULT 'Other',
	"priority" text NOT NULL DEFAULT 'Low',
	"description" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"dueDate" timestamp with time zone NOT NULL,
	"completeDate" timestamp with time zone,
	"source" text NOT NULL DEFAULT 'manual',
	"sourceType" text,
	"sourceRefId" text,
	"createdBy" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now()
);

CREATE TABLE "task_assignees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taskId" uuid NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
	"userId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now()
);

CREATE TABLE "task_associations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taskId" uuid NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
	"entityType" text NOT NULL,
	"entityId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now()
);

-- Owning advisor for a client (used to assign auto-generated tasks)
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "advisorId" uuid;

-- Enable RLS (mirrors existing tables: open to authenticated users)
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_assignees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_associations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access" ON "tasks" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "task_assignees" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "task_associations" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_tasks_dueDate" ON "tasks" ("dueDate");
CREATE INDEX IF NOT EXISTS "idx_tasks_status" ON "tasks" ("status");
CREATE INDEX IF NOT EXISTS "idx_task_assignees_user" ON "task_assignees" ("userId", "taskId");
CREATE INDEX IF NOT EXISTS "idx_task_assignees_task" ON "task_assignees" ("taskId");
CREATE INDEX IF NOT EXISTS "idx_task_associations_entity" ON "task_associations" ("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "idx_task_associations_task" ON "task_associations" ("taskId");

-- One auto-generated task per anchor (sourceType + sourceRefId) keeps the sync idempotent
CREATE UNIQUE INDEX IF NOT EXISTS "uq_tasks_auto_anchor" ON "tasks" ("sourceType", "sourceRefId") WHERE "source" = 'auto';

-- Dedup guards on junction tables
CREATE UNIQUE INDEX IF NOT EXISTS "uq_task_assignees" ON "task_assignees" ("taskId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_task_associations" ON "task_associations" ("taskId", "entityType", "entityId");

-- ------------------------------------------------------------------------------
-- Migration 36/64: 0032_notes.sql
-- ------------------------------------------------------------------------------

-- Migration: Reddit-style threaded notes for admins & advisors
-- Tables: notes (self-referencing thread), note_associations, note_attachments,
-- note_reactions, note_votes, note_notifications.

-- 1. Notes (a note and its replies/sub-replies share one table)
CREATE TABLE IF NOT EXISTS "notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "parentId" uuid REFERENCES "notes" ("id") ON DELETE CASCADE,
  "rootId" uuid,
  "depth" integer DEFAULT 0 NOT NULL,
  "title" text,
  "body" text DEFAULT '' NOT NULL,
  "authorId" uuid,
  "score" integer DEFAULT 0 NOT NULL,
  "isDeleted" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_notes_rootId" ON "notes" ("rootId");
CREATE INDEX IF NOT EXISTS "idx_notes_parentId" ON "notes" ("parentId");
CREATE INDEX IF NOT EXISTS "idx_notes_depth_updatedAt" ON "notes" ("depth", "updatedAt" DESC);

-- 2. Note associations (notes <-> clients/companies)
CREATE TABLE IF NOT EXISTS "note_associations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "noteId" uuid NOT NULL REFERENCES "notes" ("id") ON DELETE CASCADE,
  "entityType" text NOT NULL,
  "entityId" uuid NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_note_associations_noteId" ON "note_associations" ("noteId");
CREATE INDEX IF NOT EXISTS "idx_note_associations_entity" ON "note_associations" ("entityType", "entityId");

-- 3. Note attachments (files + pasted link previews)
CREATE TABLE IF NOT EXISTS "note_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "noteId" uuid NOT NULL REFERENCES "notes" ("id") ON DELETE CASCADE,
  "kind" text DEFAULT 'file' NOT NULL,
  "fileUrl" text,
  "fileName" text,
  "fileSize" integer,
  "mimeType" text,
  "linkUrl" text,
  "linkTitle" text,
  "linkFavicon" text,
  "linkProvider" text,
  "createdAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_note_attachments_noteId" ON "note_attachments" ("noteId");

-- 4. Note reactions (one row per user+emoji)
CREATE TABLE IF NOT EXISTS "note_reactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "noteId" uuid NOT NULL REFERENCES "notes" ("id") ON DELETE CASCADE,
  "userId" uuid NOT NULL,
  "emoji" text NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_note_reactions" ON "note_reactions" ("noteId", "userId", "emoji");

-- 5. Note votes (Reddit up/down; one row per user+note)
CREATE TABLE IF NOT EXISTS "note_votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "noteId" uuid NOT NULL REFERENCES "notes" ("id") ON DELETE CASCADE,
  "userId" uuid NOT NULL,
  "value" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_note_votes" ON "note_votes" ("noteId", "userId");

-- 6. Note notifications (@mentions + replies)
CREATE TABLE IF NOT EXISTS "note_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "noteId" uuid NOT NULL REFERENCES "notes" ("id") ON DELETE CASCADE,
  "rootId" uuid,
  "recipientId" uuid NOT NULL,
  "actorId" uuid,
  "actorName" text,
  "type" text NOT NULL,
  "preview" text,
  "isRead" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_note_notifications_recipient" ON "note_notifications" ("recipientId", "isRead");

-- 7. Row Level Security — open to authenticated users, mirroring the tasks
-- tables (0031). Server actions run with the service-role key; the /dashboard
-- route guard already enforces MFA (AAL2) at the application layer, and the
-- notes UI is gated to admin/advisor roles there.
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_associations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_notifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access" ON "notes" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "note_associations" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "note_attachments" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "note_reactions" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "note_votes" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON "note_notifications" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- Migration 37/64: 0033_add_client_insurance_policies.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "lifePolicies" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "disabilityPolicies" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "ltcPolicies" jsonb DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------------------------
-- Migration 38/64: 0034_create_financial_account_types.sql
-- ------------------------------------------------------------------------------

-- Create financial_account_types table
CREATE TABLE IF NOT EXISTS "financial_account_types" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE "financial_account_types" ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: All authenticated users can read account types
DROP POLICY IF EXISTS "Allow authenticated select access" ON "financial_account_types";
CREATE POLICY "Allow authenticated select access"
ON "financial_account_types"
FOR SELECT
TO authenticated
USING (true);

-- 2. Write/Modify Policy: Only administrators can create, update, or delete records
DROP POLICY IF EXISTS "Allow admin full access to financial_account_types" ON "financial_account_types";
CREATE POLICY "Allow admin full access to financial_account_types"
ON "financial_account_types"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Seed initial alphabetical values
INSERT INTO "financial_account_types" ("name") VALUES
  ('Corporate Account'),
  ('Defined Benefit Account'),
  ('Individual Account'),
  ('IRA'),
  ('Joint Account / JTWROS'),
  ('Profit Sharing Account'),
  ('ROTH IRA'),
  ('Solo 401K'),
  ('TrustAccount')
ON CONFLICT ("name") DO NOTHING;

-- ------------------------------------------------------------------------------
-- Migration 39/64: 0035_create_custodians.sql
-- ------------------------------------------------------------------------------

-- Create custodians table
CREATE TABLE IF NOT EXISTS "custodians" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE "custodians" ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: All authenticated users can read custodians
DROP POLICY IF EXISTS "Allow authenticated select access" ON "custodians";
CREATE POLICY "Allow authenticated select access"
ON "custodians"
FOR SELECT
TO authenticated
USING (true);

-- 2. Write/Modify Policy: Only administrators can create, update, or delete records
DROP POLICY IF EXISTS "Allow admin full access to custodians" ON "custodians";
CREATE POLICY "Allow admin full access to custodians"
ON "custodians"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Seed initial alphabetical values
INSERT INTO "custodians" ("name") VALUES
  ('Axos'),
  ('Dunham'),
  ('PCS'),
  ('Schwab')
ON CONFLICT ("name") DO NOTHING;

-- ------------------------------------------------------------------------------
-- Migration 40/64: 0036_add_client_money_manager_accounts.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "moneyManagerAccounts" jsonb DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------------------------
-- Migration 41/64: 0037_add_client_record_keeper_accounts.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "recordKeeperAccounts" jsonb DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------------------------
-- Migration 42/64: 0038_create_referral_types.sql
-- ------------------------------------------------------------------------------

-- Create referral_types table
CREATE TABLE IF NOT EXISTS "referral_types" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text UNIQUE NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE "referral_types" ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: All authenticated users can read referral types
DROP POLICY IF EXISTS "Allow authenticated select access" ON "referral_types";
CREATE POLICY "Allow authenticated select access"
ON "referral_types"
FOR SELECT
TO authenticated
USING (true);

-- 2. Write/Modify Policy: Only administrators can create, update, or delete records
DROP POLICY IF EXISTS "Allow admin full access to referral_types" ON "referral_types";
CREATE POLICY "Allow admin full access to referral_types"
ON "referral_types"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Seed initial alphabetical values
INSERT INTO "referral_types" ("name") VALUES
  ('Advisor Referral'),
  ('Cold Call'),
  ('Digital'),
  ('Direct Mail'),
  ('Employee'),
  ('HNWL - Pac Life'),
  ('John Cannon'),
  ('Lead - Clark'),
  ('Lee Wetherington Homes'),
  ('Other'),
  ('Retirement Plan')
ON CONFLICT ("name") DO NOTHING;

-- ------------------------------------------------------------------------------
-- Migration 43/64: 0039_update_client_referrals.sql
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- Migration 44/64: 0040_add_client_document_url.sql
-- ------------------------------------------------------------------------------

-- Add documentUrl column to clients table
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "documentUrl" text;

-- ------------------------------------------------------------------------------
-- Migration 45/64: 20260707160141_add_logo_url_to_firms_and_vendors.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "accounting_firms" ADD COLUMN "logoUrl" text;
ALTER TABLE "actuarial_firms" ADD COLUMN "logoUrl" text;
ALTER TABLE "banks" ADD COLUMN "logoUrl" text;
ALTER TABLE "law_firms" ADD COLUMN "logoUrl" text;
ALTER TABLE "property_and_casualty_firms" ADD COLUMN "logoUrl" text;
ALTER TABLE "life_insurance_companies" ADD COLUMN "logoUrl" text;
ALTER TABLE "disability_insurance_companies" ADD COLUMN "logoUrl" text;
ALTER TABLE "long_term_care_insurance" ADD COLUMN "logoUrl" text;
ALTER TABLE "money_managers" ADD COLUMN "logoUrl" text;
ALTER TABLE "record_keepers" ADD COLUMN "logoUrl" text;

-- ------------------------------------------------------------------------------
-- Migration 46/64: 20260707163440_add_social_media_to_people.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "socialMedia" jsonb DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------------------------
-- Migration 47/64: 20260707170500_add_social_media_and_logo_to_companies.sql
-- ------------------------------------------------------------------------------

ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "logoUrl" text;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "socialMedia" jsonb DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------------------------
-- Migration 48/64: 20260707175600_move_pii_to_clients.sql
-- ------------------------------------------------------------------------------

-- Add driversLicense and pii to clients
ALTER TABLE "clients" ADD COLUMN "driversLicense" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "clients" ADD COLUMN "pii" jsonb DEFAULT '{}'::jsonb;

-- Migrate existing client DL and PII data
UPDATE clients c
SET "driversLicense" = p."driversLicense",
    "pii" = p."pii"
FROM people p
WHERE c."personId" = p.id;

-- Migrate family member Gender and DOB into the Client's familyMembers JSONB list
WITH updated_family_members AS (
  SELECT 
    c.id AS client_id,
    jsonb_agg(
      m || jsonb_build_object(
        'gender', p.pii->>'biologicalGender',
        'birthDate', p.pii->>'birthDate'
      )
    ) AS new_family_members
  FROM clients c
  CROSS JOIN LATERAL jsonb_array_elements(c."familyMembers") AS m
  JOIN people p ON p.id = (m->>'personId')::uuid
  GROUP BY c.id
)
UPDATE clients c
SET "familyMembers" = u.new_family_members
FROM updated_family_members u
WHERE c.id = u.client_id;

-- Drop driversLicense and pii from people
ALTER TABLE "people" DROP COLUMN "driversLicense";
ALTER TABLE "people" DROP COLUMN "pii";

-- ------------------------------------------------------------------------------
-- Migration 49/64: 20260707184500_add_person_titles.sql
-- ------------------------------------------------------------------------------

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

-- ------------------------------------------------------------------------------
-- Migration 50/64: 20260708130510_create_events_table.sql
-- ------------------------------------------------------------------------------

-- Create events table
CREATE TABLE IF NOT EXISTS "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "addressId" uuid REFERENCES "addresses"("id") ON DELETE SET NULL,
  "startDate" timestamp with time zone,
  "endDate" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: All authenticated users can read events
DROP POLICY IF EXISTS "Allow authenticated select access" ON "events";
CREATE POLICY "Allow authenticated select access"
ON "events"
FOR SELECT
TO authenticated
USING (true);

-- 2. Write/Modify Policy: Only administrators can create, update, or delete records
DROP POLICY IF EXISTS "Allow admin full access to events" ON "events";
CREATE POLICY "Allow admin full access to events"
ON "events"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Alter table clients to support event referrals
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "referredByEventId" uuid REFERENCES "events"("id") ON DELETE SET NULL;

-- Create index for the foreign key column to optimize RLS queries
CREATE INDEX IF NOT EXISTS "clients_referredByEventId_idx" ON "clients" ("referredByEventId");

-- ------------------------------------------------------------------------------
-- Migration 51/64: 20260708144200_add_referred_by_advisor.sql
-- ------------------------------------------------------------------------------

-- Alter table clients to support advisor referrals
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "referredByAdvisorId" uuid REFERENCES "users"("uid") ON DELETE SET NULL;

-- Create index for the foreign key column to optimize RLS queries
CREATE INDEX IF NOT EXISTS "clients_referredByAdvisorId_idx" ON "clients" ("referredByAdvisorId");

-- ------------------------------------------------------------------------------
-- Migration 52/64: 20260710100000_create_workflows_tables.sql
-- ------------------------------------------------------------------------------

-- Workflow Templates: reusable definitions created by admins
CREATE TABLE IF NOT EXISTS "workflow_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "description" text, -- Tiptap HTML
  "createdBy" uuid REFERENCES "users"("uid") ON DELETE SET NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Workflow Template Steps: ordered steps belonging to a template
CREATE TABLE IF NOT EXISTS "workflow_template_steps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "templateId" uuid NOT NULL REFERENCES "workflow_templates"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "setDueDate" boolean NOT NULL DEFAULT false,
  "dueDays" integer, -- 1-7, only when setDueDate
  "dueDateBase" text, -- workflow_start | after_last_step
  "priority" text NOT NULL DEFAULT 'None', -- None | Low | Medium | High
  "description" text, -- Tiptap HTML
  "responsibility" text NOT NULL DEFAULT 'advisor', -- advisor | client
  "attachments" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "workflow_template_steps_templateId_idx" ON "workflow_template_steps" ("templateId");

-- Workflow Instances: a snapshot copy of a template assigned to a client or company
CREATE TABLE IF NOT EXISTS "workflow_instances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "templateId" uuid REFERENCES "workflow_templates"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "description" text, -- Tiptap HTML (snapshot)
  "entityType" text NOT NULL, -- client | company
  "entityId" uuid NOT NULL,
  "startDate" timestamp with time zone NOT NULL DEFAULT now(),
  "createdBy" uuid REFERENCES "users"("uid") ON DELETE SET NULL,
  "completedAt" timestamp with time zone,
  "completedBy" uuid REFERENCES "users"("uid") ON DELETE SET NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "workflow_instances_entity_idx" ON "workflow_instances" ("entityType", "entityId");

-- Workflow Instance Steps: snapshot of template steps with completion tracking
CREATE TABLE IF NOT EXISTS "workflow_instance_steps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "instanceId" uuid NOT NULL REFERENCES "workflow_instances"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "setDueDate" boolean NOT NULL DEFAULT false,
  "dueDays" integer,
  "dueDateBase" text, -- workflow_start | after_last_step
  "priority" text NOT NULL DEFAULT 'None',
  "description" text, -- Tiptap HTML
  "responsibility" text NOT NULL DEFAULT 'advisor',
  "attachments" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "dueDate" timestamp with time zone, -- resolved due date for this instance
  "completedAt" timestamp with time zone,
  "completedBy" uuid REFERENCES "users"("uid") ON DELETE SET NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "workflow_instance_steps_instanceId_idx" ON "workflow_instance_steps" ("instanceId");

-- Enable Row Level Security (RLS)
ALTER TABLE "workflow_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_template_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_instance_steps" ENABLE ROW LEVEL SECURITY;

-- Read: all authenticated users
DROP POLICY IF EXISTS "Allow authenticated select access" ON "workflow_templates";
CREATE POLICY "Allow authenticated select access"
ON "workflow_templates" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated select access" ON "workflow_template_steps";
CREATE POLICY "Allow authenticated select access"
ON "workflow_template_steps" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated select access" ON "workflow_instances";
CREATE POLICY "Allow authenticated select access"
ON "workflow_instances" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated select access" ON "workflow_instance_steps";
CREATE POLICY "Allow authenticated select access"
ON "workflow_instance_steps" FOR SELECT TO authenticated USING (true);

-- Templates write: admins only
DROP POLICY IF EXISTS "Allow admin full access to workflow_templates" ON "workflow_templates";
CREATE POLICY "Allow admin full access to workflow_templates"
ON "workflow_templates" FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Allow admin full access to workflow_template_steps" ON "workflow_template_steps";
CREATE POLICY "Allow admin full access to workflow_template_steps"
ON "workflow_template_steps" FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Instances write: admins and advisors
DROP POLICY IF EXISTS "Allow staff full access to workflow_instances" ON "workflow_instances";
CREATE POLICY "Allow staff full access to workflow_instances"
ON "workflow_instances" FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role IN ('admin', 'advisor')
  )
);

DROP POLICY IF EXISTS "Allow staff full access to workflow_instance_steps" ON "workflow_instance_steps";
CREATE POLICY "Allow staff full access to workflow_instance_steps"
ON "workflow_instance_steps" FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role IN ('admin', 'advisor')
  )
);

-- ------------------------------------------------------------------------------
-- Migration 53/64: 20260711000000_add_company_advisor.sql
-- ------------------------------------------------------------------------------

-- Assigned advisor for a company (mirrors clients.advisorId).
-- An Admin is an advisor with admin capabilities, so both admins and advisors
-- can be assigned. Visibility is unaffected: all admins/advisors see all companies.
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "advisorId" uuid;

-- ------------------------------------------------------------------------------
-- Migration 54/64: 20260711153500_add_company_document_url.sql
-- ------------------------------------------------------------------------------

-- Add documentUrl column to companies table
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "documentUrl" text;

-- ------------------------------------------------------------------------------
-- Migration 55/64: 20260713115837_refactor_workflows.sql
-- ------------------------------------------------------------------------------

-- Add graph column to workflow_templates
ALTER TABLE "workflow_templates" ADD COLUMN IF NOT EXISTS "graph" jsonb NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb;

-- Add outcomes, positionX, positionY to workflow_template_steps
ALTER TABLE "workflow_template_steps" ADD COLUMN IF NOT EXISTS "outcomes" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "workflow_template_steps" ADD COLUMN IF NOT EXISTS "positionX" numeric DEFAULT 0;
ALTER TABLE "workflow_template_steps" ADD COLUMN IF NOT EXISTS "positionY" numeric DEFAULT 0;

-- Add templateStepId, outcomes, selectedOutcome to workflow_instance_steps
ALTER TABLE "workflow_instance_steps" ADD COLUMN IF NOT EXISTS "templateStepId" uuid REFERENCES "workflow_template_steps"("id") ON DELETE SET NULL;
ALTER TABLE "workflow_instance_steps" ADD COLUMN IF NOT EXISTS "outcomes" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "workflow_instance_steps" ADD COLUMN IF NOT EXISTS "selectedOutcome" jsonb DEFAULT NULL;

-- Generate index for the foreign key column to optimize lookups
CREATE INDEX IF NOT EXISTS "workflow_instance_steps_templateStepId_idx" ON "workflow_instance_steps" ("templateStepId");

-- ------------------------------------------------------------------------------
-- Migration 56/64: 20260713195500_create_opportunities.sql
-- ------------------------------------------------------------------------------

-- Create opportunity_pipelines table
CREATE TABLE IF NOT EXISTS "opportunity_pipelines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Create opportunity_pipeline_stages table
CREATE TABLE IF NOT EXISTS "opportunity_pipeline_stages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pipelineId" uuid NOT NULL REFERENCES "opportunity_pipelines"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "order" integer NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Create opportunities table
CREATE TABLE IF NOT EXISTS "opportunities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" uuid REFERENCES "clients"("id") ON DELETE CASCADE,
  "companyId" uuid REFERENCES "companies"("id") ON DELETE CASCADE,
  "amount" numeric NOT NULL DEFAULT '0.00',
  "targetCloseDate" timestamp with time zone,
  "pipelineId" uuid NOT NULL REFERENCES "opportunity_pipelines"("id") ON DELETE RESTRICT,
  "stageId" uuid NOT NULL REFERENCES "opportunity_pipeline_stages"("id") ON DELETE RESTRICT,
  "probabilityWin" integer NOT NULL DEFAULT 0,
  "notes" text,
  "resultStatus" text,
  "resultNotes" text,
  "updatedById" uuid REFERENCES "users"("uid") ON DELETE SET NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE "opportunity_pipelines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "opportunity_pipeline_stages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "opportunities" ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: All authenticated users can read pipelines
DROP POLICY IF EXISTS "Allow authenticated select access" ON "opportunity_pipelines";
CREATE POLICY "Allow authenticated select access"
ON "opportunity_pipelines"
FOR SELECT
TO authenticated
USING (true);

-- 2. Write/Modify Policy: Only administrators can manage pipelines
DROP POLICY IF EXISTS "Allow admin full access to opportunity_pipelines" ON "opportunity_pipelines";
CREATE POLICY "Allow admin full access to opportunity_pipelines"
ON "opportunity_pipelines"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- RLS Policies for opportunity_pipeline_stages
DROP POLICY IF EXISTS "Allow authenticated select access" ON "opportunity_pipeline_stages";
CREATE POLICY "Allow authenticated select access"
ON "opportunity_pipeline_stages"
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow admin full access to opportunity_pipeline_stages" ON "opportunity_pipeline_stages";
CREATE POLICY "Allow admin full access to opportunity_pipeline_stages"
ON "opportunity_pipeline_stages"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- RLS Policies for opportunities: All authenticated users (advisors/admins) have full access
DROP POLICY IF EXISTS "Allow authenticated full access" ON "opportunities";
CREATE POLICY "Allow authenticated full access"
ON "opportunities"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Indexes for performance and RLS
CREATE INDEX IF NOT EXISTS "idx_opportunity_pipeline_stages_pipeline" ON "opportunity_pipeline_stages" ("pipelineId");
CREATE INDEX IF NOT EXISTS "idx_opportunity_pipeline_stages_order" ON "opportunity_pipeline_stages" ("order");
CREATE INDEX IF NOT EXISTS "idx_opportunities_client" ON "opportunities" ("clientId");
CREATE INDEX IF NOT EXISTS "idx_opportunities_company" ON "opportunities" ("companyId");
CREATE INDEX IF NOT EXISTS "idx_opportunities_pipeline" ON "opportunities" ("pipelineId");
CREATE INDEX IF NOT EXISTS "idx_opportunities_stage" ON "opportunities" ("stageId");
CREATE INDEX IF NOT EXISTS "idx_opportunities_updatedBy" ON "opportunities" ("updatedById");
CREATE INDEX IF NOT EXISTS "idx_opportunities_resultStatus" ON "opportunities" ("resultStatus");

-- ------------------------------------------------------------------------------
-- Migration 57/64: 20260716113000_add_portal_settings_website_logo.sql
-- ------------------------------------------------------------------------------

-- Seed default website and logo settings in keyvals if they do not exist
INSERT INTO "keyvals" ("id", "value") VALUES
  ('BUSINESS_WEBSITE', ''),
  ('COMPANY_LOGO_URL', '')
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------------------------
-- Migration 58/64: 20260716114200_add_company_name_social_media_settings.sql
-- ------------------------------------------------------------------------------

-- Seed default company name and social media settings in keyvals if they do not exist
INSERT INTO "keyvals" ("id", "value") VALUES
  ('COMPANY_NAME', 'Prestige Advisors'),
  ('PORTAL_SOCIAL_MEDIA', '[]')
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------------------------
-- Migration 59/64: 20260721152236_case_insensitive_user_sync.sql
-- ------------------------------------------------------------------------------

-- Update trigger function to be case-insensitive on email comparison
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already exists in public.users by email (case-insensitive)
  IF EXISTS (
    SELECT 1 FROM public.users WHERE LOWER(email) = LOWER(NEW.email)
  ) THEN
    -- Update the existing profile's uid and other metadata
    UPDATE public.users
    SET 
      uid = NEW.id,
      "firstName" = COALESCE(NEW.raw_user_meta_data->>'firstName', "firstName", ''),
      "lastName" = COALESCE(NEW.raw_user_meta_data->>'lastName', "lastName", ''),
      role = COALESCE(NEW.raw_user_meta_data->>'role', role, 'client'),
      "updatedAt" = now()
    WHERE LOWER(email) = LOWER(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- Migration 60/64: 20260723081500_add_notebook_url.sql
-- ------------------------------------------------------------------------------

-- Add notebookUrl column to clients and companies tables
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "notebookUrl" text;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "notebookUrl" text;

-- ------------------------------------------------------------------------------
-- Migration 61/64: 20260723120000_create_teams_tables.sql
-- ------------------------------------------------------------------------------

-- Create Teams and Team Members tables
CREATE TABLE IF NOT EXISTS "teams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read teams"
ON "teams" FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated insert teams"
ON "teams" FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated update teams"
ON "teams" FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated delete teams"
ON "teams" FOR DELETE TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

-- Create Team Members table
CREATE TABLE IF NOT EXISTS "team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "teamId" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "userId" uuid NOT NULL REFERENCES "users"("uid") ON DELETE CASCADE,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "team_members_team_user_unique" UNIQUE ("teamId", "userId")
);

ALTER TABLE "team_members" ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS "team_members_teamId_idx" ON "team_members" ("teamId");
CREATE INDEX IF NOT EXISTS "team_members_userId_idx" ON "team_members" ("userId");

CREATE POLICY "Allow authenticated read team_members"
ON "team_members" FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated insert team_members"
ON "team_members" FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated update team_members"
ON "team_members" FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated delete team_members"
ON "team_members" FOR DELETE TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

-- ------------------------------------------------------------------------------
-- Migration 62/64: 20260723120500_update_opportunities_and_history.sql
-- ------------------------------------------------------------------------------

-- Add closeDate column to opportunities
ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "closeDate" timestamp with time zone;

-- Create opportunity_history table
CREATE TABLE IF NOT EXISTS "opportunity_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "opportunityId" uuid NOT NULL REFERENCES "opportunities"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "oldValue" text,
  "newValue" text,
  "reason" text,
  "actorId" uuid REFERENCES "users"("uid") ON DELETE SET NULL,
  "actorName" text NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE "opportunity_history" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow authenticated select access to opportunity_history" ON "opportunity_history";
CREATE POLICY "Allow authenticated select access to opportunity_history"
ON "opportunity_history"
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert access to opportunity_history" ON "opportunity_history";
CREATE POLICY "Allow authenticated insert access to opportunity_history"
ON "opportunity_history"
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update access to opportunity_history" ON "opportunity_history";
CREATE POLICY "Allow authenticated update access to opportunity_history"
ON "opportunity_history"
FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete access to opportunity_history" ON "opportunity_history";
CREATE POLICY "Allow authenticated delete access to opportunity_history"
ON "opportunity_history"
FOR DELETE
TO authenticated
USING (true);

-- Indexes for performance and foreign key columns targeted by RLS
CREATE INDEX IF NOT EXISTS "idx_opportunity_history_opportunity_id" ON "opportunity_history" ("opportunityId");
CREATE INDEX IF NOT EXISTS "idx_opportunity_history_actor_id" ON "opportunity_history" ("actorId");

-- ------------------------------------------------------------------------------
-- Migration 63/64: 20260723143000_add_default_aum_perc.sql
-- ------------------------------------------------------------------------------

-- Seed default AUM % in keyvals if it does not exist
INSERT INTO "keyvals" ("id", "value") VALUES
  ('DEFAULT_AUM_PERC', '1')
ON CONFLICT ("id") DO NOTHING;

-- ------------------------------------------------------------------------------
-- Migration 64/64: 20260723193516_add_opportunity_value_fields.sql
-- ------------------------------------------------------------------------------

-- Add fields to opportunity_pipelines to track value stream options
ALTER TABLE "opportunity_pipelines" ADD COLUMN "hasFlatFee" boolean NOT NULL DEFAULT false;
ALTER TABLE "opportunity_pipelines" ADD COLUMN "hasAum" boolean NOT NULL DEFAULT false;
ALTER TABLE "opportunity_pipelines" ADD COLUMN "hasLifeInsurance" boolean NOT NULL DEFAULT false;

-- Add fields to opportunities to track individual value streams and calculate total opportunity amount
ALTER TABLE "opportunities" ADD COLUMN "flatFee" numeric NOT NULL DEFAULT '0.00';
ALTER TABLE "opportunities" ADD COLUMN "aumAmount" numeric NOT NULL DEFAULT '0.00';
ALTER TABLE "opportunities" ADD COLUMN "aumPercentage" numeric NOT NULL DEFAULT '0.00';
ALTER TABLE "opportunities" ADD COLUMN "lifeInsurance" numeric NOT NULL DEFAULT '0.00';

