ALTER TABLE "insurance_companies" RENAME TO "life_insurance_companies";--> statement-breakpoint
ALTER TABLE "client_policies" RENAME COLUMN "insuranceCompanyId" TO "lifeInsuranceCompanyId";