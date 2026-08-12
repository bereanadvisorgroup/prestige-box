import { z } from "zod";

// --- Base Schemas ---

export const AddressSchema = z.object({
  id: z.string().optional(),
  street1: z.string().min(1, "Street 1 is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().default("USA"),
  createdAt: z.string().optional(),
});

export const EmailTypeSchema = z.enum(["Personal", "Work", "Other"]);
export const EmailAddressSchema = z.object({
  id: z.string(),
  address: z.string().email("Invalid email address"),
  type: EmailTypeSchema,
  isPrimary: z.boolean().default(false),
});

export const PhoneTypeSchema = z.enum(["Work", "Home", "Mobile", "Vacation", "Fax", "Other"]);
export const PhoneNumberSchema = z.object({
  id: z.string(),
  number: z.string().min(1, "Phone number is required"),
  type: PhoneTypeSchema,
  isPrimary: z.boolean().default(false),
});

export const SocialMediaTypeSchema = z.enum(["Facebook", "Instagram", "X", "LinkedIn", "YouTube"]);
export const SocialMediaAccountSchema = z.object({
  id: z.string(),
  type: SocialMediaTypeSchema,
  url: z.string().url("Invalid social media URL (must start with http:// or https://)"),
  isPrimary: z.boolean().default(false),
  useProfilePhoto: z.boolean().default(false),
});

export const DriversLicenseSchema = z.object({
  number: z.string().optional(),
  issueState: z.string().optional(),
  issueDate: z.string().optional(),
  expirationDate: z.string().optional(),
});

export const BiologicalGenderSchema = z.enum(["Male", "Female"]);

export const PiiSchema = z.object({
  ssn: z.string().optional(),
  biologicalGender: BiologicalGenderSchema.optional(),
  birthDate: z.string().optional(),
});

export const AddressTypeSchema = z.enum(["Home", "Business", "Vacation", "Other"]);
export const PersonAddressSchema = z.object({
  id: z.string(),
  type: AddressTypeSchema,
  isPrimary: z.boolean().default(false),
});

export const PersonSchema = z.object({
  id: z.string().optional(),
  prefix: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  suffix: z.string().optional(),
  photoUrl: z.string().optional().nullable(),
  emails: z.array(EmailAddressSchema).default([]),
  phones: z.array(PhoneNumberSchema).default([]),
  socialMedia: z.array(SocialMediaAccountSchema).default([]),
  addresses: z.array(PersonAddressSchema).default([]),
  addressIds: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const HouseholdMemberRole = z.enum([
  "HEAD",
  "SPOUSE",
  "PARTNER",
  "SON",
  "DAUGHTER",
  "GRANDSON",
  "GRANDDAUGHTER",
  "GREAT_GRANDSON",
  "GREAT_GRANDDAUGHTER",
  "COUSIN",
  "UNCLE",
  "AUNT",
  "NEPHEW",
  "NIECE",
  "BROTHER",
  "SISTER",
  "FATHER",
  "MOTHER",
  "GRANDFATHER",
  "GRANDMOTHER",
  "IN_LAW",
  "OTHER",
  "DEPENDENT",
  "TRUSTEE",
  "MEMBER",
]);
export type HouseholdMemberRole = z.infer<typeof HouseholdMemberRole>;

export const HouseholdMemberParentageSchema = z.enum(["BOTH", "HEAD", "SPOUSE"]);
export type HouseholdMemberParentage = z.infer<typeof HouseholdMemberParentageSchema>;

export const HouseholdMemberRelatedToSchema = z.enum(["HEAD", "SPOUSE"]);
export type HouseholdMemberRelatedTo = z.infer<typeof HouseholdMemberRelatedToSchema>;

export const HouseholdMemberSchema = z.object({
  id: z.string().optional(),
  householdId: z.string().optional(),
  clientId: z.string(),
  role: HouseholdMemberRole,
  isPrimaryHousehold: z.boolean().default(false),
  includeInFinancialRollup: z.boolean().default(true),
  familyRelationship: z.string().optional(),
  parentage: HouseholdMemberParentageSchema.optional(),
  relatedTo: HouseholdMemberRelatedToSchema.optional(),
  tags: z.array(z.string()).optional(),
});

export const HouseholdSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Household name is required"),
  addressId: z.string(),
  members: z.array(HouseholdMemberSchema).min(1, "At least one member is required"),
  headName: z.string().optional(),
  spouseName: z.string().optional(),
  headAndSpouse: z.string().optional(),
  dependentCount: z.number().optional(),
  totalMembersCount: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const OwnershipTypeSchema = z.enum(["INDIVIDUAL", "JOINT_TENANTS", "TENANTS_IN_COMMON", "TRUST", "CORPORATE"]);
export type OwnershipType = z.infer<typeof OwnershipTypeSchema>;

export const OwnershipSplitSchema = z.object({
  clientId: z.string(),
  percentage: z.number().min(0, "Percentage must be at least 0").max(100, "Percentage cannot exceed 100"),
});
export type OwnershipSplit = z.infer<typeof OwnershipSplitSchema>;

export const LifeInsuranceCompanySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Insurance company name is required"),
  websiteUrl: z.string().url("Invalid website URL"),
  policyNames: z.array(z.string()).default([]),
  phone: z.string().optional().or(z.literal("")),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  personTitles: z.record(z.string(), z.string()).default({}),
  companyIds: z.array(z.string()).default([]),
  clientIds: z.array(z.string()).default([]),
  logoUrl: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const DisabilityInsuranceCompanySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Insurance company name is required"),
  websiteUrl: z.string().url("Invalid website URL"),
  policyNames: z.array(z.string()).default([]),
  phone: z.string().optional().or(z.literal("")),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  personTitles: z.record(z.string(), z.string()).default({}),
  companyIds: z.array(z.string()).default([]),
  clientIds: z.array(z.string()).default([]),
  logoUrl: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const LongTermCareInsuranceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Insurance name is required"),
  websiteUrl: z.string().url("Invalid website URL"),
  policyNames: z.array(z.string()).default([]),
  phone: z.string().optional().or(z.literal("")),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  personTitles: z.record(z.string(), z.string()).default({}),
  companyIds: z.array(z.string()).default([]),
  clientIds: z.array(z.string()).default([]),
  logoUrl: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const PaymentAccountSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Account name is required"),
  bankId: z.string().min(1, "Bank association is required"),
});

export const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
] as const;

export const SitusTypeSchema = z.enum(["Physical", "Economic", "Administrative", "Trust"]);
export const NexusTypeSchema = z.enum(["Sales Tax", "Income Tax", "Payroll"]);

export const SitusSchema = z.object({
  id: z.string().optional(),
  jurisdiction: z.enum(US_STATES),
  type: SitusTypeSchema,
  effectiveDate: z.string(), // ISO String
});

export const NexusSchema = z.object({
  id: z.string().optional(),
  jurisdiction: z.enum(US_STATES),
  type: NexusTypeSchema,
});

export const CompanySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Company name is required"),
  dba: z.string().optional().nullable(),
  ein: z
    .string()
    .regex(/^\d{2}-\d{7}$/, "EIN must be in XX-XXXXXXX format")
    .optional()
    .or(z.literal(""))
    .nullable(),
  addressId: z.string().optional().nullable(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  advisorId: z.string().optional().nullable(),
  situsRecords: z.array(SitusSchema).default([]),
  nexusRecords: z.array(NexusSchema).default([]),
  paymentAccounts: z.array(PaymentAccountSchema).default([]),
  lifeDocuments: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        url: z.string(),
        type: z.string(),
        uploadedAt: z.string().optional(),
        firmId: z.string().optional(),
      }),
    )
    .default([]),
  disabilityDocuments: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        url: z.string(),
        type: z.string(),
        uploadedAt: z.string().optional(),
        firmId: z.string().optional(),
      }),
    )
    .default([]),
  ltcDocuments: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        url: z.string(),
        type: z.string(),
        uploadedAt: z.string().optional(),
        firmId: z.string().optional(),
      }),
    )
    .default([]),
  logoUrl: z.string().optional().nullable(),
  socialMedia: z.array(SocialMediaAccountSchema).default([]),
  documentUrl: z.string().optional().nullable(),
  notebookUrl: z.string().optional().nullable(),
  estimatedValue: z.number().min(0, "Estimated value must be positive").default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CompanyOwnerSchema = z.object({
  id: z.string().optional(),
  companyId: z.string(),
  personId: z.string(),
  ownershipPercentage: z.number().min(0, "Ownership must be at least 0%").max(100, "Ownership cannot exceed 100%"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type CompanyOwner = z.infer<typeof CompanyOwnerSchema>;

export const FamilyRelationType = z.enum(["Spouse", "Child", "Grandchild", "Great Grandchild"]);
export const FamilyMemberSchema = z.object({
  id: z.string().optional(),
  personId: z.string(),
  relationship: FamilyRelationType,
  parentId: z.string().optional(),
  marriageDate: z.string().optional(), // YYYY-MM-DD; meaningful on the Spouse entry, drives anniversary tasks
  gender: BiologicalGenderSchema.optional(),
  birthDate: z.string().optional(),
});

export const EmploymentSchema = z.object({
  id: z.string().optional(),
  occupation: z.string().min(1, "Occupation is required"),
  employerName: z.string().min(1, "Employer name is required"),
  employerAddressId: z.string().optional(),
  employerPhone: z.string().optional(),
  startDate: z.string().optional(), // YYYY-MM-DD
  endDate: z.string().optional(), // YYYY-MM-DD
});

export const DocumentSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  url: z.string(),
  type: z.string(), // PC / Life / Estate / etc specific types
  uploadedAt: z.string().optional(),
  firmId: z.string().optional(),
  isUnderManagement: z.boolean().optional(),
  managingAgencyId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// --- Estate Planning documents ---

export const EstateDocumentTypeSchema = z.enum(["Will", "Revocable Trust", "Irrevocable Trust", "Other"]);

// A single uploaded file within an estate document repository.
export const EstateDocumentFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  uploadedAt: z.string().optional(),
});

// Reference to a person or company (used for grantor / trustees).
export const EstatePartyRefSchema = z.object({
  kind: z.enum(["person", "company"]),
  id: z.string(),
});

// An estate planning "document repository": shared metadata plus one or more files.
// e.g. a Revocable Trust holds the original trust document and any later amendments.
export const EstateDocumentSchema = z.object({
  id: z.string(),
  type: EstateDocumentTypeSchema,
  files: z.array(EstateDocumentFileSchema).default([]),
  // Will
  effectiveDate: z.string().optional(), // YYYY-MM-DD (also used by Trusts)
  beneficiaries: z.string().optional(), // shared by Will and Trusts
  // Revocable / Irrevocable Trust
  trustName: z.string().optional(),
  amendmentDate: z.string().optional(), // YYYY-MM-DD
  attorneyFirmId: z.string().optional(), // references a law firm
  grantor: EstatePartyRefSchema.optional(),
  trustees: z.array(EstatePartyRefSchema).default([]),
  // Other
  description: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// --- Insurance policies (Life / Disability / Long-Term Care) ---

// A beneficiary reference: a person, a company, or one of the client's estate trusts.
export const InsuranceBeneficiaryKindSchema = z.enum(["person", "company", "trust"]);
export const InsuranceBeneficiaryRefSchema = z.object({
  kind: InsuranceBeneficiaryKindSchema,
  id: z.string(),
});

// A single beneficiary line: who receives the benefit and their percentage of it.
export const InsuranceBeneficiarySchema = z.object({
  id: z.string(),
  ref: InsuranceBeneficiaryRefSchema,
  percent: z.number().min(0, "Percent must be at least 0").max(100, "Percent cannot exceed 100"),
});

// A single uploaded file attached to an insurance policy.
export const InsurancePolicyFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  title: z.enum(["Issued Illustration", "Policy Receipts", "Other"]).optional(),
  uploadedAt: z.string().optional(),
});

// --- Money Manager accounts (managed investment accounts held with a money manager firm) ---

// A single managed account a client holds with a money manager. Its `value` is also surfaced
// as a virtual asset so it contributes to the client's total net worth (see actions/assets.ts).
// `status` is derived: an account is "Open" while `closeDate` is empty and "Closed" once set.
export const MoneyManagerAccountSchema = z.object({
  id: z.string(),
  moneyManagerId: z.string().min(1, "Money manager is required"), // references money_managers
  financialTypeId: z.string().optional(), // references financial_account_types
  accountNumber: z.string().optional(),
  title: z.string().optional(),
  value: z.number().min(0, "Value must be positive").default(0),
  ownerIds: z.array(z.string()).min(1, "At least one owner is required").default([]),
  ownershipType: OwnershipTypeSchema.default("INDIVIDUAL"),
  ownershipSplits: z.array(OwnershipSplitSchema).optional(),
  managementBeginDate: z.string().optional(), // YYYY-MM-DD
  closeDate: z.string().optional(), // YYYY-MM-DD; presence flips status to "Closed"
  custodianId: z.string().optional(), // references custodians
  notes: z.string().optional(),
  beneficiaries: z.array(InsuranceBeneficiarySchema).default([]),
  contingentBeneficiaries: z.array(InsuranceBeneficiarySchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type MoneyManagerAccount = z.infer<typeof MoneyManagerAccountSchema>;

// --- Record Keeper accounts (accounts a client holds with a record keeper firm) ---

// A single account a client holds with a record keeper. Its `value` is also surfaced as a
// virtual asset so it contributes to the client's total net worth (see actions/assets.ts).
// `status` is derived: an account is "Open" while `closeDate` is empty and "Closed" once set.
export const RecordKeeperAccountSchema = z.object({
  id: z.string(),
  recordKeeperId: z.string().min(1, "Record keeper is required"), // references record_keepers
  financialTypeId: z.string().optional(), // references financial_account_types
  accountNumber: z.string().optional(),
  title: z.string().optional(),
  value: z.number().min(0, "Value must be positive").default(0),
  ownerIds: z.array(z.string()).min(1, "At least one owner is required").default([]),
  ownershipType: OwnershipTypeSchema.default("INDIVIDUAL"),
  ownershipSplits: z.array(OwnershipSplitSchema).optional(),
  managementBeginDate: z.string().optional(), // YYYY-MM-DD
  closeDate: z.string().optional(), // YYYY-MM-DD; presence flips status to "Closed"
  notes: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type RecordKeeperAccount = z.infer<typeof RecordKeeperAccountSchema>;

// An insurance policy record (Life / Disability / Long-Term Care), optionally tied to a vendor company.
export const InsurancePolicySchema = z.object({
  id: z.string(),
  companyId: z.string().optional(), // the associated insurance company / vendor (firm)
  policyNumber: z.string().optional(),
  policyName: z.string().optional(),
  ownerIds: z.array(z.string()).min(1, "At least one owner is required").default([]),
  ownershipType: OwnershipTypeSchema.default("INDIVIDUAL"),
  ownershipSplits: z.array(OwnershipSplitSchema).optional(),
  issueDate: z.string().optional(), // YYYY-MM-DD
  renewalDate: z.string().optional(), // YYYY-MM-DD
  anniversaryDate: z.string().optional(), // YYYY-MM-DD
  premiumFrequency: z.enum(["Monthly", "Quarterly", "Semi-Annual", "Annually"]).optional(),
  premiumPayment: z.number().default(0),
  note: z.string().optional(),
  eliminationPeriod: z.enum(["60 days", "90 days", "120 days", "365 days"]).optional(),
  beneficiaries: z.array(InsuranceBeneficiarySchema).default([]),
  contingentBeneficiaries: z.array(InsuranceBeneficiarySchema).default([]),
  files: z.array(InsurancePolicyFileSchema).default([]),
  isUnderManagement: z.boolean().optional(),
  managingAgencyId: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const LoanTypeSelection = z.enum(["Auto", "Boat", "Business", "Student", "Credit Card", "Mortgage"]);
export const LoanSchema = z.object({
  id: z.string().optional(),
  loanType: LoanTypeSelection,
  assetId: z.string().optional().nullable(),
  bankId: z.string().optional().nullable(),
  ownerIds: z.array(z.string()).min(1, "At least one owner is required").default([]),
  ownershipType: OwnershipTypeSchema.default("INDIVIDUAL"),
  ownershipSplits: z.array(OwnershipSplitSchema).optional(),
  currentBalance: z.number().default(0),
  monthlyPayment: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  statementPath: z.string().optional(),
});

export const MortgageSchema = z.object({
  id: z.string().optional(),
  addressId: z.string(),
  ownerIds: z.array(z.string()).min(1, "At least one owner is required").default([]),
  ownershipType: OwnershipTypeSchema.default("INDIVIDUAL"),
  ownershipSplits: z.array(OwnershipSplitSchema).optional(),
  purchasePrice: z.number().optional(),
  currentMarketValue: z.number().optional(),
  statementPath: z.string().optional(),
});

export const ClientSchema = z.object({
  id: z.string().optional(),
  personId: z.string(),
  advisorId: z.string().optional().nullable(),
  referredById: z.string().optional().nullable(),
  referredByType: z.string().optional().nullable(),
  referredByCompanyId: z.string().optional().nullable(),
  referredByPersonId: z.string().optional().nullable(),
  referredByReferralTypeId: z.string().optional().nullable(),
  referredByEventId: z.string().optional().nullable(),
  referredByAdvisorId: z.string().optional().nullable(),
  hobbies: z.array(z.string()).default([]),
  favoriteSportsTeams: z.array(z.string()).default([]),
  paymentAccounts: z.array(PaymentAccountSchema).default([]),
  familyMembers: z.array(FamilyMemberSchema).default([]),
  employments: z.array(EmploymentSchema).default([]),
  pcDocuments: z.array(DocumentSchema).default([]),
  lifeDocuments: z.array(DocumentSchema).default([]),
  ltcDocuments: z.array(DocumentSchema).default([]),
  estateDocuments: z.array(EstateDocumentSchema).default([]),
  lifePolicies: z.array(InsurancePolicySchema).default([]),
  disabilityPolicies: z.array(InsurancePolicySchema).default([]),
  ltcPolicies: z.array(InsurancePolicySchema).default([]),
  moneyManagerAccounts: z.array(MoneyManagerAccountSchema).default([]),
  recordKeeperAccounts: z.array(RecordKeeperAccountSchema).default([]),
  liabilities: z.array(LoanSchema).default([]),
  mortgages: z.array(MortgageSchema).default([]),
  driversLicense: DriversLicenseSchema.optional(),
  pii: PiiSchema.optional(),
  documentUrl: z.string().optional().nullable(),
  notebookUrl: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const AssetSubTypeSchema = z.enum([
  "Primary Residence",
  "Investment Properties",
  "Vehicles",
  "Valuables",
  "Business Ownership",
  "Managed Account",
  "Record Keeper Account",
]);

export const AssetSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().optional(),
  ownerIds: z.array(z.string()).min(1, "At least one owner is required").default([]),
  ownershipType: OwnershipTypeSchema.default("INDIVIDUAL"),
  ownershipSplits: z.array(OwnershipSplitSchema).optional(),
  name: z.string().min(1, "Asset name/label is required"),
  category: z.string().default("Real Estate and Fixed Physical Assets"),
  subType: AssetSubTypeSchema,
  currentValue: z.number().min(0, "Current value must be positive"),
  currency: z.string().default("USD"),
  isAutomated: z.boolean().default(false),
  institutionName: z.string().default("Manual"),
  addressId: z.string().optional().nullable(),
  isCompanyAsset: z.boolean().optional(),
  companyId: z.string().optional().nullable(),
  // Set on virtual assets derived from a client's money manager accounts; managed from the
  // Money Managers page and therefore read-only in the assets table.
  isManagedAccount: z.boolean().optional(),
  // Set on virtual assets derived from a client's record keeper accounts; managed from the
  // Record Keepers page and therefore read-only in the assets table.
  isRecordKeeperAccount: z.boolean().optional(),
  isLinked: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const AssetHistorySchema = z.object({
  id: z.string().optional(),
  assetId: z.string(),
  value: z.number().min(0, "Value must be positive"),
  recordedAt: z.string().optional(),
  createdAt: z.string().optional(),
});

export const CompanyValuationHistorySchema = z.object({
  id: z.string().optional(),
  companyId: z.string(),
  value: z.number().min(0, "Value must be positive"),
  valuationDate: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ChangeHistoryEntityTypeSchema = z.enum(["client", "company", "task", "person"]);
export const ChangeHistoryActionSchema = z.enum(["created", "updated", "added", "removed", "deleted"]);

export const ChangeHistorySchema = z.object({
  id: z.string().optional(),
  entityType: ChangeHistoryEntityTypeSchema,
  entityId: z.string(),
  subType: z.string(),
  action: ChangeHistoryActionSchema,
  fieldName: z.string().nullable().optional(),
  fieldLabel: z.string().nullable().optional(),
  oldValue: z.string().nullable().optional(),
  newValue: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  actorId: z.string().nullable().optional(),
  actorName: z.string().nullable().optional(),
  changedAt: z.string().optional(),
  createdAt: z.string().optional(),
});

export type ChangeHistoryEntityType = z.infer<typeof ChangeHistoryEntityTypeSchema>;
export type ChangeHistoryAction = z.infer<typeof ChangeHistoryActionSchema>;
export type ChangeHistory = z.infer<typeof ChangeHistorySchema>;
// History record enriched with the resolved entity (client/company) display name for the report view.
export type ChangeHistoryWithEntity = ChangeHistory & { entityName: string | null };

export const PaymentSchedule = z.enum(["monthly", "quarterly", "semi-annually", "annually"]);

export const ClientPolicySchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  lifeInsuranceCompanyId: z.string().optional().nullable(),
  disabilityInsuranceCompanyId: z.string().optional().nullable(),
  longTermCareInsuranceId: z.string().optional().nullable(),
  paymentAccountId: z.string().optional().nullable(),
  policyName: z.string().min(1, "Policy name is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  premiumAmount: z.number().min(0, "Premium must be positive"),
  effectiveDate: z.string(), // ISO date
  renewalDate: z.string(), // ISO date
  paymentSchedule: PaymentSchedule,
  isUnderManagement: z.boolean().optional(),
  managingAgencyId: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const LawFirmSchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).default([]),
  personTitles: z.record(z.string(), z.string()).default({}),
  firmName: z.string().min(1, "Firm name is required"),
  firmAddressId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  logoUrl: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const AccountingFirmSchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  personTitles: z.record(z.string(), z.string()).default({}),
  firmName: z.string().min(1, "Firm name is required"),
  firmAddressId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  logoUrl: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const InsuranceAgencySchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  personTitles: z.record(z.string(), z.string()).default({}),
  firmName: z.string().min(1, "Firm name is required"),
  firmAddressId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  logoUrl: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ActuarialFirmSchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  personTitles: z.record(z.string(), z.string()).default({}),
  firmName: z.string().min(1, "Firm name is required"),
  firmAddressId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  logoUrl: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const BankSchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  personTitles: z.record(z.string(), z.string()).default({}),
  firmName: z.string().min(1, "Bank name is required"),
  firmAddressId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  logoUrl: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const PropertyAndCasualtyFirmSchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  personTitles: z.record(z.string(), z.string()).default({}),
  firmName: z.string().min(1, "Firm name is required"),
  firmAddressId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  logoUrl: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const MoneyManagerSchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  personTitles: z.record(z.string(), z.string()).default({}),
  firmName: z.string().min(1, "Money manager name is required"),
  firmAddressId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  logoUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const RecordKeeperSchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  personTitles: z.record(z.string(), z.string()).default({}),
  firmName: z.string().min(1, "Record keeper name is required"),
  firmAddressId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  logoUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// --- Inferred Types ---

export type Address = z.infer<typeof AddressSchema>;
export type PersonAddress = z.infer<typeof PersonAddressSchema>;
export type SocialMediaAccount = z.infer<typeof SocialMediaAccountSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type HouseholdMember = z.infer<typeof HouseholdMemberSchema>;
export type Household = z.infer<typeof HouseholdSchema>;
export type LifeInsuranceCompany = z.infer<typeof LifeInsuranceCompanySchema>;
export type DisabilityInsuranceCompany = z.infer<typeof DisabilityInsuranceCompanySchema>;
export type LongTermCareInsurance = z.infer<typeof LongTermCareInsuranceSchema>;
export type PaymentAccount = z.infer<typeof PaymentAccountSchema>;
export type SitusType = z.infer<typeof SitusTypeSchema>;
export type NexusType = z.infer<typeof NexusTypeSchema>;
export type Situs = z.infer<typeof SitusSchema>;
export type Nexus = z.infer<typeof NexusSchema>;
export type Client = z.infer<typeof ClientSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type CompanyValuationHistory = z.infer<typeof CompanyValuationHistorySchema>;
export type LawFirm = z.infer<typeof LawFirmSchema>;
export type AccountingFirm = z.infer<typeof AccountingFirmSchema>;
export type InsuranceAgency = z.infer<typeof InsuranceAgencySchema>;
export type ActuarialFirm = z.infer<typeof ActuarialFirmSchema>;
export type Bank = z.infer<typeof BankSchema>;
export type PropertyAndCasualtyFirm = z.infer<typeof PropertyAndCasualtyFirmSchema>;
export type MoneyManager = z.infer<typeof MoneyManagerSchema>;
export type RecordKeeper = z.infer<typeof RecordKeeperSchema>;
export type ClientPolicy = z.infer<typeof ClientPolicySchema>;
export type AssetSubType = z.infer<typeof AssetSubTypeSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type AssetHistory = z.infer<typeof AssetHistorySchema>;

export type PaymentSchedule = z.infer<typeof PaymentSchedule>;
export type FamilyMember = z.infer<typeof FamilyMemberSchema>;
export type Employment = z.infer<typeof EmploymentSchema>;
export type LoanInfo = z.infer<typeof LoanSchema>;
export type MortgageInfo = z.infer<typeof MortgageSchema>;
export type ClientDocument = z.infer<typeof DocumentSchema>;
export type EstateDocument = z.infer<typeof EstateDocumentSchema>;
export type EstateDocumentFile = z.infer<typeof EstateDocumentFileSchema>;
export type EstatePartyRef = z.infer<typeof EstatePartyRefSchema>;
export type EstateDocumentType = z.infer<typeof EstateDocumentTypeSchema>;
export type InsuranceBeneficiaryKind = z.infer<typeof InsuranceBeneficiaryKindSchema>;
export type InsuranceBeneficiaryRef = z.infer<typeof InsuranceBeneficiaryRefSchema>;
export type InsuranceBeneficiary = z.infer<typeof InsuranceBeneficiarySchema>;
export type InsurancePolicyFile = z.infer<typeof InsurancePolicyFileSchema>;
export type InsurancePolicy = z.infer<typeof InsurancePolicySchema>;

// --- Form Schemas (omit server-generated fields) ---

export const AddressFormSchema = AddressSchema.omit({ createdAt: true });
export const PersonFormSchema = PersonSchema.omit({ createdAt: true, updatedAt: true });
export const HouseholdFormSchema = HouseholdSchema.omit({ createdAt: true, updatedAt: true });
export const LifeInsuranceCompanyFormSchema = LifeInsuranceCompanySchema.omit({ createdAt: true, updatedAt: true });
export const DisabilityInsuranceCompanyFormSchema = DisabilityInsuranceCompanySchema.omit({
  createdAt: true,
  updatedAt: true,
});
export const LongTermCareInsuranceFormSchema = LongTermCareInsuranceSchema.omit({ createdAt: true, updatedAt: true });
export const ClientFormSchema = ClientSchema.omit({ createdAt: true, updatedAt: true });
export const CompanyFormSchema = CompanySchema.omit({ createdAt: true, updatedAt: true })
  .extend({
    owners: z
      .array(
        z.object({
          personId: z.string().min(1, "Person is required"),
          ownershipPercentage: z
            .number()
            .min(0, "Ownership must be at least 0%")
            .max(100, "Ownership cannot exceed 100%"),
        }),
      )
      .default([]),
  })
  .refine(
    (data) => {
      const sum = (data.owners || []).reduce((acc, curr) => acc + curr.ownershipPercentage, 0);
      return sum <= 100;
    },
    {
      message: "Total ownership percentage cannot exceed 100%",
      path: ["owners"],
    },
  );
export const LawFirmFormSchema = LawFirmSchema.omit({ createdAt: true, updatedAt: true });
export const AccountingFirmFormSchema = AccountingFirmSchema.omit({ createdAt: true, updatedAt: true });
export const InsuranceAgencyFormSchema = InsuranceAgencySchema.omit({ createdAt: true, updatedAt: true });
export const ActuarialFirmFormSchema = ActuarialFirmSchema.omit({ createdAt: true, updatedAt: true });
export const BankFormSchema = BankSchema.omit({ createdAt: true, updatedAt: true });
export const PropertyAndCasualtyFirmFormSchema = PropertyAndCasualtyFirmSchema.omit({
  createdAt: true,
  updatedAt: true,
});
export const MoneyManagerFormSchema = MoneyManagerSchema.omit({ createdAt: true, updatedAt: true });
export const RecordKeeperFormSchema = RecordKeeperSchema.omit({ createdAt: true, updatedAt: true });
export const ClientPolicyFormSchema = ClientPolicySchema.omit({ createdAt: true, updatedAt: true });
export const AssetFormSchema = AssetSchema.omit({ createdAt: true, updatedAt: true });

export type AddressFormValues = z.infer<typeof AddressFormSchema>;
export type PersonFormValues = z.infer<typeof PersonFormSchema>;
export type HouseholdFormValues = z.infer<typeof HouseholdFormSchema>;
export type LifeInsuranceCompanyFormValues = z.infer<typeof LifeInsuranceCompanyFormSchema>;
export type DisabilityInsuranceCompanyFormValues = z.infer<typeof DisabilityInsuranceCompanyFormSchema>;
export type LongTermCareInsuranceFormValues = z.infer<typeof LongTermCareInsuranceFormSchema>;
export type ClientFormValues = z.infer<typeof ClientFormSchema>;
export type CompanyFormValues = z.infer<typeof CompanyFormSchema>;
export type LawFirmFormValues = z.infer<typeof LawFirmFormSchema>;
export type AccountingFirmFormValues = z.infer<typeof AccountingFirmFormSchema>;
export type InsuranceAgencyFormValues = z.infer<typeof InsuranceAgencyFormSchema>;
export type ActuarialFirmFormValues = z.infer<typeof ActuarialFirmFormSchema>;
export type BankFormValues = z.infer<typeof BankFormSchema>;
export type PropertyAndCasualtyFirmFormValues = z.infer<typeof PropertyAndCasualtyFirmFormSchema>;
export type MoneyManagerFormValues = z.infer<typeof MoneyManagerFormSchema>;
export type RecordKeeperFormValues = z.infer<typeof RecordKeeperFormSchema>;
export type ClientPolicyFormValues = z.infer<typeof ClientPolicyFormSchema>;
export type AssetFormValues = z.infer<typeof AssetFormSchema>;

export type AddressFormInput = z.input<typeof AddressFormSchema>;
export type PersonFormInput = z.input<typeof PersonFormSchema>;
export type HouseholdFormInput = z.input<typeof HouseholdFormSchema>;
export type LifeInsuranceCompanyFormInput = z.input<typeof LifeInsuranceCompanyFormSchema>;
export type DisabilityInsuranceCompanyFormInput = z.input<typeof DisabilityInsuranceCompanyFormSchema>;
export type LongTermCareInsuranceFormInput = z.input<typeof LongTermCareInsuranceFormSchema>;
export type ClientFormInput = z.input<typeof ClientFormSchema>;
export type CompanyFormInput = z.input<typeof CompanyFormSchema>;
export type LawFirmFormInput = z.input<typeof LawFirmFormSchema>;
export type AccountingFirmFormInput = z.input<typeof AccountingFirmFormSchema>;
export type InsuranceAgencyFormInput = z.input<typeof InsuranceAgencyFormSchema>;
export type ActuarialFirmFormInput = z.input<typeof ActuarialFirmFormSchema>;
export type BankFormInput = z.input<typeof BankFormSchema>;
export type PropertyAndCasualtyFirmFormInput = z.input<typeof PropertyAndCasualtyFirmFormSchema>;
export type MoneyManagerFormInput = z.input<typeof MoneyManagerFormSchema>;
export type RecordKeeperFormInput = z.input<typeof RecordKeeperFormSchema>;
export type ClientPolicyFormInput = z.input<typeof ClientPolicyFormSchema>;
export type AssetFormInput = z.input<typeof AssetFormSchema>;

// --- Dashboard Types ---

export interface UpcomingPayment {
  policyId: string;
  clientId: string;
  clientName: string;
  policyName: string;
  insuranceCompanyName: string;
  amount: number;
  dueDate: string;
  paymentSchedule: PaymentSchedule;
}

// --- Task Management ---

export const TaskStatusSchema = z.enum(["New", "In Process", "Waiting Input", "Complete"]);
export const TaskCategorySchema = z.enum(["Other", "Birthday", "Wedding Anniversary", "Policy Renewal"]);
export const TaskPrioritySchema = z.enum(["Low", "Medium", "High"]);
export const TaskSourceSchema = z.enum(["manual", "auto"]);
export const TaskSourceTypeSchema = z.enum(["birthday", "anniversary", "renewal"]);
export const TaskAssociationEntitySchema = z.enum(["client", "company"]);

export const TaskStatuses = TaskStatusSchema.options;
export const TaskCategories = TaskCategorySchema.options;
export const TaskPriorities = TaskPrioritySchema.options;

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskCategory = z.infer<typeof TaskCategorySchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type TaskSource = z.infer<typeof TaskSourceSchema>;
export type TaskSourceType = z.infer<typeof TaskSourceTypeSchema>;
export type TaskAssociationEntity = z.infer<typeof TaskAssociationEntitySchema>;

export const TaskAttachmentSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  url: z.string(),
  type: z.string(),
  uploadedAt: z.string().optional(),
  uploadedBy: z.string().optional(),
});
export type TaskAttachment = z.infer<typeof TaskAttachmentSchema>;

export const TaskAssociationSchema = z.object({
  entityType: TaskAssociationEntitySchema,
  entityId: z.string(),
});
export type TaskAssociation = z.infer<typeof TaskAssociationSchema>;

export const TaskSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Task name is required"),
  status: TaskStatusSchema.default("New"),
  category: TaskCategorySchema.default("Other"),
  priority: TaskPrioritySchema.default("Low"),
  description: z.string().nullable().optional(),
  attachments: z.array(TaskAttachmentSchema).default([]),
  dueDate: z.string().min(1, "Due date is required"), // ISO date-time
  completeDate: z.string().nullable().optional(), // system-managed
  source: TaskSourceSchema.default("manual"),
  sourceType: TaskSourceTypeSchema.nullable().optional(),
  sourceRefId: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

// Task enriched with its assignees and associations for list/board views.
export interface TaskAssigneeRef {
  userId: string;
  name: string;
  role?: string;
}
export interface TaskAssociationRef {
  entityType: TaskAssociationEntity;
  entityId: string;
  name: string;
}
export type TaskWithRelations = Task & {
  assignees: TaskAssigneeRef[];
  associations: TaskAssociationRef[];
};

// Form payload: assignees & associations are edited inline and persisted to junction tables.
export const TaskFormSchema = TaskSchema.omit({
  completeDate: true,
  source: true,
  sourceType: true,
  sourceRefId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  assigneeIds: z.array(z.string()).min(1, "At least one assignee is required"),
  associations: z.array(TaskAssociationSchema).default([]),
});
export type TaskFormValues = z.infer<typeof TaskFormSchema>;
export type TaskFormInput = z.input<typeof TaskFormSchema>;

export const FinancialAccountTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type FinancialAccountType = z.infer<typeof FinancialAccountTypeSchema>;

export const CustodianSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Custodian = z.infer<typeof CustodianSchema>;

export const ReferralTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type ReferralType = z.infer<typeof ReferralTypeSchema>;

export const EventSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  addressId: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Event = z.infer<typeof EventSchema>;

// Opportunities Types & Schemas
export const OpportunityPipelineStageSchema = z.object({
  id: z.string().optional(),
  pipelineId: z.string().optional(),
  name: z.string().min(1, "Stage name is required"),
  order: z.number().int().nonnegative(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type OpportunityPipelineStage = z.infer<typeof OpportunityPipelineStageSchema>;

export const OpportunityPipelineSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Pipeline name is required"),
  isActive: z.boolean().default(true),
  hasFlatFee: z.boolean().default(false),
  hasAum: z.boolean().default(false),
  hasLifeInsurance: z.boolean().default(false),
  stages: z.array(OpportunityPipelineStageSchema).min(1, "At least one stage is required"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type OpportunityPipeline = z.infer<typeof OpportunityPipelineSchema>;

export const OpportunitySchema = z.object({
  id: z.string().optional(),
  clientId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid currency amount")
    .default("0.00"),
  flatFee: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid currency amount")
    .default("0.00"),
  aumAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid currency amount")
    .default("0.00"),
  aumPercentage: z
    .string()
    .regex(/^\d+(\.\d{1,4})?$/, "Must be a valid percentage")
    .default("0.00"),
  lifeInsurance: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid currency amount")
    .default("0.00"),
  targetCloseDate: z.string().nullable().optional(),
  pipelineId: z.string().min(1, "Pipeline is required"),
  stageId: z.string().min(1, "Stage is required"),
  probabilityWin: z.number().int().min(0).max(100).default(0),
  notes: z.string().nullable().optional(),
  resultStatus: z.enum(["TRASH", "WON", "LOST"]).nullable().optional(),
  resultNotes: z.string().nullable().optional(),
  closeDate: z.string().nullable().optional(),
  changeReason: z.string().nullable().optional(),
  updatedById: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Opportunity = z.infer<typeof OpportunitySchema>;

export const OpportunityHistorySchema = z.object({
  id: z.string().optional(),
  opportunityId: z.string(),
  type: z.string(),
  oldValue: z.string().nullable().optional(),
  newValue: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  actorId: z.string().nullable().optional(),
  actorName: z.string(),
  createdAt: z.string().optional(),
});
export type OpportunityHistory = z.infer<typeof OpportunityHistorySchema>;
