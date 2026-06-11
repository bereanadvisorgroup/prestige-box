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
