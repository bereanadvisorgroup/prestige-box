ALTER TABLE "life_insurance_companies" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "life_insurance_companies" ADD COLUMN "personIds" uuid[] DEFAULT '{}'::uuid[] NOT NULL;