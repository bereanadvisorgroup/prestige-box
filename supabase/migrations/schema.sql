-- Prestige Box Database Schema for Supabase (PostgreSQL)
-- Paste this script into the Supabase SQL Editor to initialize the database tables.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  "uid" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "email" TEXT UNIQUE NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "role" TEXT NOT NULL DEFAULT 'client',
  "photoURL" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Addresses Table
CREATE TABLE IF NOT EXISTS public.addresses (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "street1" TEXT NOT NULL,
  "street2" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "zipCode" TEXT NOT NULL,
  "country" TEXT DEFAULT 'USA',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. People Table
CREATE TABLE IF NOT EXISTS public.people (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "prefix" TEXT,
  "firstName" TEXT NOT NULL,
  "middleName" TEXT,
  "lastName" TEXT NOT NULL,
  "suffix" TEXT,
  "emails" JSONB DEFAULT '[]'::jsonb,
  "phones" JSONB DEFAULT '[]'::jsonb,
  "driversLicense" JSONB DEFAULT '{}'::jsonb,
  "pii" JSONB DEFAULT '{}'::jsonb,
  "addresses" JSONB DEFAULT '[]'::jsonb,
  "addressIds" UUID[] DEFAULT '{}'::uuid[],
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Households Table
CREATE TABLE IF NOT EXISTS public.households (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "addressId" UUID,
  "memberIds" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insurance Companies Table
CREATE TABLE IF NOT EXISTS public.insurance_companies (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "websiteUrl" TEXT NOT NULL,
  "policyNames" TEXT[] DEFAULT '{}'::text[],
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "personId" UUID NOT NULL,
  "hobbies" TEXT[] DEFAULT '{}'::text[],
  "favoriteSportsTeams" TEXT[] DEFAULT '{}'::text[],
  "paymentAccounts" JSONB DEFAULT '[]'::jsonb,
  "familyMembers" JSONB DEFAULT '[]'::jsonb,
  "employments" JSONB DEFAULT '[]'::jsonb,
  "pcDocuments" JSONB DEFAULT '[]'::jsonb,
  "lifeDocuments" JSONB DEFAULT '[]'::jsonb,
  "estateDocuments" JSONB DEFAULT '[]'::jsonb,
  "liabilities" JSONB DEFAULT '[]'::jsonb,
  "mortgages" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "dba" TEXT,
  "ein" TEXT,
  "addressId" UUID,
  "website" TEXT,
  "phone" TEXT,
  "clientIds" UUID[] DEFAULT '{}'::uuid[],
  "situsRecords" JSONB DEFAULT '[]'::jsonb,
  "nexusRecords" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Client Policies Table
CREATE TABLE IF NOT EXISTS public.client_policies (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" UUID NOT NULL,
  "insuranceCompanyId" UUID NOT NULL,
  "paymentAccountId" TEXT,
  "policyName" TEXT NOT NULL,
  "policyNumber" TEXT NOT NULL,
  "premiumAmount" NUMERIC NOT NULL DEFAULT 0.00,
  "effectiveDate" TIMESTAMPTZ NOT NULL,
  "renewalDate" TIMESTAMPTZ NOT NULL,
  "paymentSchedule" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Lawyers Table
CREATE TABLE IF NOT EXISTS public.lawyers (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "personId" UUID NOT NULL,
  "firmName" TEXT NOT NULL,
  "firmAddressId" UUID,
  "clientIds" UUID[] DEFAULT '{}'::uuid[],
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Accountants Table
CREATE TABLE IF NOT EXISTS public.accountants (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "personId" UUID NOT NULL,
  "firmName" TEXT NOT NULL,
  "firmAddressId" UUID,
  "clientIds" UUID[] DEFAULT '{}'::uuid[],
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGERS & FUNCTIONS FOR AUTH SYNCING
-- Trigger to automatically create a profile in public.users when a user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users ("uid", "email", "firstName", "lastName", "role", "createdAt")
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'firstName', split_part(new.raw_user_meta_data->>'full_name', ' ', 1), ''),
    coalesce(new.raw_user_meta_data->>'lastName', split_part(new.raw_user_meta_data->>'full_name', ' ', 2), ''),
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    coalesce(new.created_at, now())
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Disable RLS or configure RLS (Optional, can be tailored as needed)
-- For Next.js Server Actions using service role keys, RLS is bypassed.
-- In case of using anonymous key client-side, we enable reading but restrict writing:
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountants ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow authenticated users full access, or limit as needed)
-- For simplicity and parity with staff role logic, we allow all authenticated users to read and write.
CREATE POLICY "Allow authenticated read" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow user update profile" ON public.users FOR UPDATE USING (auth.uid() = "uid");
CREATE POLICY "Allow authenticated read and write" ON public.addresses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read and write" ON public.people FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read and write" ON public.households FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read and write" ON public.insurance_companies FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read and write" ON public.clients FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read and write" ON public.companies FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read and write" ON public.client_policies FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read and write" ON public.lawyers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read and write" ON public.accountants FOR ALL TO authenticated USING (true);
