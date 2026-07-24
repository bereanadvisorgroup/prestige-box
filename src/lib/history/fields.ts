import type { FieldConfig } from "./record";

/**
 * Field definitions used to diff records into change-history rows.
 * Timestamps (createdAt/updatedAt) and ids are intentionally excluded.
 * Complex jsonb columns are diffed as JSON so structural changes are still
 * captured, just with a coarser old/new value.
 */

// Company "Profile" fields (estimatedValue is tracked separately under "Valuation").
export const COMPANY_PROFILE_FIELDS: FieldConfig[] = [
  { name: "name", label: "Company Name" },
  { name: "dba", label: "DBA" },
  { name: "ein", label: "EIN" },
  { name: "website", label: "Website" },
  { name: "phone", label: "Phone" },
  { name: "addressId", label: "Address" },
  { name: "situsRecords", label: "Situs Records" },
  { name: "nexusRecords", label: "Nexus Records" },
  { name: "paymentAccounts", label: "Payment Accounts" },
  { name: "lifeDocuments", label: "Life Documents" },
  { name: "disabilityDocuments", label: "Disability Documents" },
  { name: "ltcDocuments", label: "LTC Documents" },
  { name: "logoUrl", label: "Logo" },
  { name: "socialMedia", label: "Social Media Accounts" },
  { name: "documentUrl", label: "Document URL" },
  { name: "notebookUrl", label: "Notebook URL" },
];

// Client (clients table) fields. Tracked under the "Profile" subtype.
export const CLIENT_PROFILE_FIELDS: FieldConfig[] = [
  { name: "referredById", label: "Referred By" },
  { name: "referredByType", label: "Referral Source Type" },
  { name: "referredByCompanyId", label: "Referred by Company" },
  { name: "referredByPersonId", label: "Referred by Person" },
  { name: "referredByReferralTypeId", label: "Referred by Referral Type" },
  { name: "referredByEventId", label: "Referred by Event" },
  { name: "referredByAdvisorId", label: "Referred by Advisor" },
  { name: "hobbies", label: "Hobbies" },
  { name: "favoriteSportsTeams", label: "Favorite Sports Teams" },
  { name: "paymentAccounts", label: "Payment Accounts" },
  { name: "familyMembers", label: "Family Members" },
  { name: "employments", label: "Employment" },
  { name: "liabilities", label: "Liabilities" },
  { name: "mortgages", label: "Mortgages" },
  { name: "pcDocuments", label: "P&C Documents" },
  { name: "lifeDocuments", label: "Life Documents" },
  { name: "ltcDocuments", label: "LTC Documents" },
  { name: "estateDocuments", label: "Estate Documents" },
  { name: "documentUrl", label: "Document URL" },
  { name: "notebookUrl", label: "Notebook URL" },
  { name: "driversLicense", label: "Driver's License" },
  { name: "pii", label: "PII" },
];

// Person (people table) fields — a client's personal/contact profile.
export const PERSON_PROFILE_FIELDS: FieldConfig[] = [
  { name: "prefix", label: "Prefix" },
  { name: "firstName", label: "First Name" },
  { name: "middleName", label: "Middle Name" },
  { name: "lastName", label: "Last Name" },
  { name: "suffix", label: "Suffix" },
  { name: "photoUrl", label: "Photo" },
  { name: "emails", label: "Email Addresses" },
  { name: "phones", label: "Phone Numbers" },
  { name: "addresses", label: "Addresses" },
];

// Client policy fields (client_policies table). Subtype is derived from the insurance type.
export const CLIENT_POLICY_FIELDS: FieldConfig[] = [
  { name: "policyName", label: "Policy Name" },
  { name: "policyNumber", label: "Policy Number" },
  { name: "premiumAmount", label: "Premium Amount" },
  { name: "effectiveDate", label: "Effective Date" },
  { name: "renewalDate", label: "Renewal Date" },
  { name: "paymentSchedule", label: "Payment Schedule" },
];

/**
 * Maps a service/vendor action's table to its history subtype label.
 * Used to fan out "linked"/"unlinked" events to affected clients & companies.
 */
export const SERVICE_SUBTYPE: Record<string, string> = {
  life_insurance_companies: "Life Insurance",
  disability_insurance_companies: "Disability Insurance",
  long_term_care_insurance: "Long Term Care",
  law_firms: "Law Firm",
  accounting_firms: "Accounting Firm",
  actuarial_firms: "Actuarial Firm",
  banks: "Bank",
  property_and_casualty_firms: "Property & Casualty",
  money_managers: "Money Manager",
  record_keepers: "Record Keeper",
};
