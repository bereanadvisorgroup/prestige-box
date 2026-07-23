-- Add fields to opportunity_pipelines to track value stream options
ALTER TABLE "opportunity_pipelines" ADD COLUMN "hasFlatFee" boolean NOT NULL DEFAULT false;
ALTER TABLE "opportunity_pipelines" ADD COLUMN "hasAum" boolean NOT NULL DEFAULT false;
ALTER TABLE "opportunity_pipelines" ADD COLUMN "hasLifeInsurance" boolean NOT NULL DEFAULT false;

-- Add fields to opportunities to track individual value streams and calculate total opportunity amount
ALTER TABLE "opportunities" ADD COLUMN "flatFee" numeric NOT NULL DEFAULT '0.00';
ALTER TABLE "opportunities" ADD COLUMN "aumAmount" numeric NOT NULL DEFAULT '0.00';
ALTER TABLE "opportunities" ADD COLUMN "aumPercentage" numeric NOT NULL DEFAULT '0.00';
ALTER TABLE "opportunities" ADD COLUMN "lifeInsurance" numeric NOT NULL DEFAULT '0.00';
