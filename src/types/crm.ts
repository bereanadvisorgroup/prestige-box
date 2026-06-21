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
  driversLicense: DriversLicenseSchema.optional(),
  pii: PiiSchema.optional(),
  addresses: z.array(PersonAddressSchema).default([]),
  addressIds: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const HouseholdMemberRole = z.enum(["home_owner", "dependent"]);

export const HouseholdMemberSchema = z.object({
  personId: z.string(),
  role: HouseholdMemberRole,
});

export const HouseholdSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Household name is required"),
  addressId: z.string(),
  memberIds: z.array(HouseholdMemberSchema).min(1, "At least one member is required"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const LifeInsuranceCompanySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Insurance company name is required"),
  websiteUrl: z.string().url("Invalid website URL"),
  policyNames: z.array(z.string()).default([]),
  phone: z.string().optional().or(z.literal("")),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  companyIds: z.array(z.string()).default([]),
  clientIds: z.array(z.string()).default([]),
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
  companyIds: z.array(z.string()).default([]),
  clientIds: z.array(z.string()).default([]),
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
  companyIds: z.array(z.string()).default([]),
  clientIds: z.array(z.string()).default([]),
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
  dba: z.string().optional(),
  ein: z
    .string()
    .regex(/^\d{2}-\d{7}$/, "EIN must be in XX-XXXXXXX format")
    .optional()
    .or(z.literal("")),
  addressId: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  clientIds: z.array(z.string()).default([]), // A company can be associated with multiple clients, and a client with multiple companies
  situsRecords: z.array(SitusSchema).default([]),
  nexusRecords: z.array(NexusSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const FamilyRelationType = z.enum(["Spouse", "Child", "Grandchild", "Great Grandchild"]);
export const FamilyMemberSchema = z.object({
  id: z.string().optional(),
  personId: z.string(),
  relationship: FamilyRelationType,
  parentId: z.string().optional(),
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
});

export const LoanTypeSelection = z.enum(["Auto", "Boat", "Business", "Student", "Credit Card", "Mortgage"]);
export const LoanSchema = z.object({
  id: z.string().optional(),
  loanType: LoanTypeSelection,
  assetId: z.string().optional().nullable(),
  bankId: z.string().optional().nullable(),
  currentBalance: z.number().default(0),
  monthlyPayment: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  statementPath: z.string().optional(),
});

export const MortgageSchema = z.object({
  id: z.string().optional(),
  addressId: z.string(),
  purchasePrice: z.number().optional(),
  currentMarketValue: z.number().optional(),
  statementPath: z.string().optional(),
});

export const ClientSchema = z.object({
  id: z.string().optional(),
  personId: z.string(),
  referredById: z.string().optional().nullable(),
  hobbies: z.array(z.string()).default([]),
  favoriteSportsTeams: z.array(z.string()).default([]),
  paymentAccounts: z.array(PaymentAccountSchema).default([]),
  familyMembers: z.array(FamilyMemberSchema).default([]),
  employments: z.array(EmploymentSchema).default([]),
  pcDocuments: z.array(DocumentSchema).default([]),
  lifeDocuments: z.array(DocumentSchema).default([]),
  ltcDocuments: z.array(DocumentSchema).default([]),
  estateDocuments: z.array(DocumentSchema).default([]),
  liabilities: z.array(LoanSchema).default([]),
  mortgages: z.array(MortgageSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const AssetSubTypeSchema = z.enum(["Primary Residence", "Investment Properties", "Vehicles", "Valuables"]);

export const AssetSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  name: z.string().min(1, "Asset name/label is required"),
  category: z.string().default("Real Estate and Fixed Physical Assets"),
  subType: AssetSubTypeSchema,
  currentValue: z.number().min(0, "Current value must be positive"),
  currency: z.string().default("USD"),
  isAutomated: z.boolean().default(false),
  institutionName: z.string().default("Manual"),
  addressId: z.string().optional().nullable(),
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
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const LawFirmSchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  firmName: z.string().min(1, "Firm name is required"),
  firmAddressId: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const AccountingFirmSchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  firmName: z.string().min(1, "Firm name is required"),
  firmAddressId: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ActuarialFirmSchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  firmName: z.string().min(1, "Firm name is required"),
  firmAddressId: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const BankSchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  firmName: z.string().min(1, "Bank name is required"),
  firmAddressId: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const PropertyAndCasualtyFirmSchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  firmName: z.string().min(1, "Firm name is required"),
  firmAddressId: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const MoneyManagerSchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  firmName: z.string().min(1, "Money manager name is required"),
  firmAddressId: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const RecordKeeperSchema = z.object({
  id: z.string().optional(),
  personIds: z.array(z.string()).min(1, "At least one person is required"),
  firmName: z.string().min(1, "Record keeper name is required"),
  firmAddressId: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  clientIds: z.array(z.string()).default([]),
  companyIds: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// --- Inferred Types ---

export type Address = z.infer<typeof AddressSchema>;
export type PersonAddress = z.infer<typeof PersonAddressSchema>;
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
export type LawFirm = z.infer<typeof LawFirmSchema>;
export type AccountingFirm = z.infer<typeof AccountingFirmSchema>;
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
export const CompanyFormSchema = CompanySchema.omit({ createdAt: true, updatedAt: true });
export const LawFirmFormSchema = LawFirmSchema.omit({ createdAt: true, updatedAt: true });
export const AccountingFirmFormSchema = AccountingFirmSchema.omit({ createdAt: true, updatedAt: true });
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
