import { z } from "zod";

// --- Stages & Sources Constants ---

export const PROSPECT_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Appt Scheduled",
  "Closed Won",
  "Closed Lost",
] as const;
export type ProspectStage = (typeof PROSPECT_STAGES)[number];

export const PROSPECT_SOURCES = [
  "Website",
  "Referral",
  "Cold Outreach",
  "Trade Show",
  "Inbound",
  "Paid Ads",
  "LinkedIn",
  "Other",
] as const;
export type ProspectSource = (typeof PROSPECT_SOURCES)[number];

export const CAMPAIGN_CHANNELS = [
  "Email",
  "Google Ads",
  "LinkedIn Ads",
  "Webinar",
  "Conference",
  "Cold Outreach",
  "Organic Social",
  "Direct Mail",
  "Referral Partner",
  "Other",
] as const;
export type CampaignChannel = (typeof CAMPAIGN_CHANNELS)[number];

export const CAMPAIGN_STATUSES = ["Planning", "Active", "Paused", "Completed"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const TOUCH_TYPES = ["First Touch", "Lead Creation", "Mid Touch", "Last Touch"] as const;
export type TouchType = (typeof TOUCH_TYPES)[number];

export const CUSTOM_FIELD_TYPES = ["text", "number", "date", "dropdown", "boolean"] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

// --- Schemas ---

export const CampaignSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Campaign name is required"),
  channel: z.enum(CAMPAIGN_CHANNELS).default("Google Ads"),
  status: z.enum(CAMPAIGN_STATUSES).default("Active"),
  budget: z.number().nonnegative("Budget must be 0 or greater").default(0),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  targetAudience: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const ProspectCustomFieldSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, "Machine key is required")
    .regex(/^[a-z0-9_]+$/, "Key must contain only lowercase letters, numbers, and underscores"),
  label: z.string().min(1, "Display label is required"),
  fieldType: z.enum(CUSTOM_FIELD_TYPES).default("text"),
  options: z.array(z.string()).default([]),
  isRequired: z.boolean().default(false),
  defaultValue: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
  createdAt: z.string().optional(),
});
export type ProspectCustomField = z.infer<typeof ProspectCustomFieldSchema>;

export const ProspectScoringRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Rule name is required"),
  conditionType: z.enum(["job_title_matches", "field_is_not_empty", "stage_is", "source_is", "inactivity_days"]),
  conditionValue: z.string().nullable().optional(),
  points: z.number(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
});
export type ProspectScoringRule = z.infer<typeof ProspectScoringRuleSchema>;

export const ProspectSchema = z.object({
  id: z.string().optional(),
  prefix: z.string().nullable().optional(),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().nullable().optional(),
  lastName: z.string().min(1, "Last name is required"),
  suffix: z.string().nullable().optional(),
  goesBy: z.string().nullable().optional(),
  email: z.string().email("Invalid email address").nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  stage: z.enum(PROSPECT_STAGES).default("New"),
  score: z.number().default(0),
  source: z.string().default("Direct"),
  assignedRepId: z.string().nullable().optional(),
  primaryCampaignId: z.string().nullable().optional(),
  utmSource: z.string().nullable().optional(),
  utmMedium: z.string().nullable().optional(),
  utmCampaign: z.string().nullable().optional(),
  utmTerm: z.string().nullable().optional(),
  utmContent: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  street2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  customFields: z.record(z.string(), z.unknown()).default({}),
  convertedClientId: z.string().nullable().optional(),
  convertedPersonId: z.string().nullable().optional(),
  convertedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Prospect = z.infer<typeof ProspectSchema>;

export const ProspectCampaignAttributionSchema = z.object({
  id: z.string().optional(),
  prospectId: z.string(),
  campaignId: z.string(),
  touchType: z.enum(TOUCH_TYPES).default("Lead Creation"),
  touchDate: z.string().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});
export type ProspectCampaignAttribution = z.infer<typeof ProspectCampaignAttributionSchema>;

// --- Enriched Types for UI Presentation ---

export type EnrichedProspect = Prospect & {
  assignedRepName?: string | null;
  primaryCampaignName?: string | null;
  isLinked?: boolean;
  scoreBreakdown?: { ruleName: string; points: number }[];
  scoreTemperature?: "Cold" | "Warm" | "Hot";
};

export type EnrichedCampaign = Campaign & {
  prospectsCount: number;
  conversionsCount: number;
  costPerProspect: number;
  conversionRate: number;
};

// --- CSV Engine Types ---

export type DeduplicationStrategy = "skip" | "overwrite" | "update_empty";

export interface CsvHeaderMapping {
  csvHeader: string;
  targetField: string; // e.g. "firstName", "email", "customFields.deal_size"
}

export interface ImportErrorLogItem {
  rowNumber: number;
  data: Record<string, unknown>;
  error: string;
}

export interface CsvImportResult {
  totalRows: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: ImportErrorLogItem[];
}
