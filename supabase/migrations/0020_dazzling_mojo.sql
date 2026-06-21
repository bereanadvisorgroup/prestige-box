ALTER TABLE "clients" ADD COLUMN "ltcDocuments" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "disability_insurance_companies" ADD COLUMN "clientIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "life_insurance_companies" ADD COLUMN "clientIds" uuid[] DEFAULT '{}'::uuid[];--> statement-breakpoint
ALTER TABLE "long_term_care_insurance" ADD COLUMN "clientIds" uuid[] DEFAULT '{}'::uuid[];