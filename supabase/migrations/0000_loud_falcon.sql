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
