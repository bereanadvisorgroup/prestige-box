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
