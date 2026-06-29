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
ALTER TABLE "assets" ADD COLUMN "addressId" uuid;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "ltcDocuments" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "estimatedValue" numeric DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "disability_insurance_companies" ADD COLUMN "clientIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "life_insurance_companies" ADD COLUMN "clientIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "long_term_care_insurance" ADD COLUMN "clientIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "company_valuation_history" ADD CONSTRAINT "company_valuation_history_companyId_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;