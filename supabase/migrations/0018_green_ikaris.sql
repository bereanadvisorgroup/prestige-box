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