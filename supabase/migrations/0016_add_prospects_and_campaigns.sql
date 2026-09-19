-- Migration: 0016_add_prospects_and_campaigns.sql

-- 1. Campaigns
CREATE TABLE IF NOT EXISTS "campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "channel" text NOT NULL, -- Email, Google Ads, LinkedIn Ads, Webinar, Conference, Cold Outreach, Organic Social, Direct Mail, Referral Partner, Other
  "status" text NOT NULL DEFAULT 'Active', -- Planning, Active, Paused, Completed
  "budget" numeric(12, 2) DEFAULT 0.00,
  "startDate" timestamp with time zone,
  "endDate" timestamp with time zone,
  "targetAudience" text,
  "description" text,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- 2. Prospects
CREATE TABLE IF NOT EXISTS "prospects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firstName" text NOT NULL,
  "lastName" text NOT NULL,
  "email" text,
  "phone" text,
  "company" text,
  "jobTitle" text,
  "prefix" text,
  "middleName" text,
  "suffix" text,
  "goesBy" text,
  "notes" text,
  "stage" text NOT NULL DEFAULT 'New', -- New, Contacted, Qualified, Appt Scheduled, Closed Won, Closed Lost
  "score" integer DEFAULT 0,
  "source" text DEFAULT 'Direct', -- Website, Referral, Cold Outreach, Trade Show, Inbound, Paid Ads, LinkedIn, Other
  "assignedRepId" uuid REFERENCES "users"("uid") ON DELETE SET NULL,
  "primaryCampaignId" uuid REFERENCES "campaigns"("id") ON DELETE SET NULL,
  -- UTM parameters
  "utmSource" text,
  "utmMedium" text,
  "utmCampaign" text,
  "utmTerm" text,
  "utmContent" text,
  -- Dynamic custom fields (key-value dictionary)
  "customFields" jsonb DEFAULT '{}'::jsonb,
  -- Bidirectional links / Client conversion fields
  "convertedClientId" uuid REFERENCES "clients"("id") ON DELETE SET NULL,
  "convertedPersonId" uuid REFERENCES "people"("id") ON DELETE SET NULL,
  "convertedAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- 3. Multi-Touch Campaign Attributions (Many:Many)
CREATE TABLE IF NOT EXISTS "prospect_campaign_attributions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "prospectId" uuid NOT NULL REFERENCES "prospects"("id") ON DELETE CASCADE,
  "campaignId" uuid NOT NULL REFERENCES "campaigns"("id") ON DELETE CASCADE,
  "touchType" text NOT NULL DEFAULT 'Lead Creation', -- First Touch, Lead Creation, Mid Touch, Last Touch
  "touchDate" timestamp with time zone DEFAULT now(),
  "notes" text,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- 4. Custom Field Definitions
CREATE TABLE IF NOT EXISTS "prospect_custom_fields" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL UNIQUE, -- machine key (e.g. deal_size)
  "label" text NOT NULL, -- human display label (e.g. Expected Deal Size)
  "fieldType" text NOT NULL, -- text, number, date, dropdown, boolean
  "options" text[] DEFAULT '{}'::text[],
  "isRequired" boolean DEFAULT false,
  "defaultValue" text,
  "sortOrder" integer DEFAULT 0,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- 5. Rule-Based Prospect Scoring Rules
CREATE TABLE IF NOT EXISTS "prospect_scoring_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "conditionType" text NOT NULL, -- job_title_matches, field_is_not_empty, stage_is, source_is, inactivity_days
  "conditionValue" text,
  "points" integer NOT NULL, -- positive or negative
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prospects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prospect_campaign_attributions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prospect_custom_fields" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prospect_scoring_rules" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read/write on campaigns" ON "campaigns" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on prospects" ON "prospects" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on attributions" ON "prospect_campaign_attributions" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on custom fields" ON "prospect_custom_fields" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on scoring rules" ON "prospect_scoring_rules" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes for foreign keys and query lookups
CREATE INDEX IF NOT EXISTS "idx_prospects_assigned_rep" ON "prospects"("assignedRepId");
CREATE INDEX IF NOT EXISTS "idx_prospects_primary_campaign" ON "prospects"("primaryCampaignId");
CREATE INDEX IF NOT EXISTS "idx_prospects_converted_client" ON "prospects"("convertedClientId");
CREATE INDEX IF NOT EXISTS "idx_prospects_converted_person" ON "prospects"("convertedPersonId");
CREATE INDEX IF NOT EXISTS "idx_prospects_email" ON "prospects"("email");
CREATE INDEX IF NOT EXISTS "idx_prospects_phone" ON "prospects"("phone");
CREATE INDEX IF NOT EXISTS "idx_prospects_stage" ON "prospects"("stage");
CREATE INDEX IF NOT EXISTS "idx_prospect_attributions_prospect" ON "prospect_campaign_attributions"("prospectId");
CREATE INDEX IF NOT EXISTS "idx_prospect_attributions_campaign" ON "prospect_campaign_attributions"("campaignId");

-- Seed default scoring rules
INSERT INTO "prospect_scoring_rules" ("name", "conditionType", "conditionValue", "points", "isActive")
VALUES
  ('Executive / Leadership Role', 'job_title_matches', 'CEO,CTO,CFO,COO,Owner,President,Founder,Partner,Director,VP,Vice President', 15, true),
  ('Phone Number Provided', 'field_is_not_empty', 'phone', 10, true),
  ('Company Provided', 'field_is_not_empty', 'company', 5, true),
  ('Inbound Web Source', 'source_is', 'Website,Inbound', 10, true),
  ('Appt Scheduled', 'stage_is', 'Appt Scheduled', 20, true),
  ('Qualified Stage', 'stage_is', 'Qualified', 15, true),
  ('Inactivity > 30 Days', 'inactivity_days', '30', -15, true)
ON CONFLICT DO NOTHING;

-- Seed initial sample campaigns
-- INSERT INTO "campaigns" ("name", "channel", "status", "budget", "targetAudience", "description")
-- VALUES
--   ('Q1 Executive Wealth Forum', 'Conference', 'Active', 12500.00, 'HNW Business Owners & Executives', 'Annual summit targeted at high net-worth founders and corporate executives.'),
--   ('Google Search - Private Wealth', 'Google Ads', 'Active', 7500.00, 'Individuals searching wealth management', 'High-intent search keyword ads targeting financial advisory and estate planning.'),
--   ('LinkedIn B2B Outreach - Founders', 'LinkedIn Ads', 'Active', 5000.00, 'Tech Founders & Partners', 'Sponsored InMail and executive video spotlight campaigns targeting founders.'),
--   ('Referral Partner Program 2026', 'Referral Partner', 'Active', 2500.00, 'Law & Accounting Firm Clients', 'Strategic co-marketing and reciprocal client introductions with law and CPA partners.')
-- ON CONFLICT DO NOTHING;

-- Seed initial Custom field definitions
-- INSERT INTO "prospect_custom_fields" ("name", "label", "fieldType", "options", "isRequired", "defaultValue", "sortOrder")
-- VALUES
--   ('estimated_investable_assets', 'Est. Investable Assets', 'dropdown', '{"Under $500k", "$500k - $1M", "$1M - $5M", "$5M - $10M", "$10M+"}', false, '$1M - $5M', 1),
--   ('industry', 'Industry Sector', 'dropdown', '{"Technology", "Healthcare", "Real Estate", "Financial Services", "Manufacturing", "Legal", "Other"}', false, 'Technology', 2),
--   ('decision_timeframe', 'Decision Timeframe', 'dropdown', '{"Immediate (Under 30 days)", "1-3 Months", "3-6 Months", "Evaluating for Next Year"}', false, '1-3 Months', 3),
--   ('preferred_contact_method', 'Preferred Contact Method', 'dropdown', '{"Email", "Phone", "LinkedIn", "In-Person"}', false, 'Email', 4)
-- ON CONFLICT DO NOTHING;
