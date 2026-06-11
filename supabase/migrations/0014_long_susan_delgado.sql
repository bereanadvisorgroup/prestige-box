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