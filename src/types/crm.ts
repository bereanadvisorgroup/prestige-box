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

export const PersonSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  mobilePhone: z.string().min(1, "Mobile phone is required"),
  email: z.string().email("Invalid email address"),
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

export const InsuranceCompanySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Insurance company name is required"),
  websiteUrl: z.string().url("Invalid website URL"),
  policyNames: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const PaymentAccountSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Account name is required"),
});

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
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
  ein: z.string().regex(/^\d{2}-\d{7}$/, "EIN must be in XX-XXXXXXX format").optional().or(z.literal("")),
  addressId: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  clientIds: z.array(z.string()).default([]), // A company can be associated with multiple clients, and a client with multiple companies
  situsRecords: z.array(SitusSchema).default([]),
  nexusRecords: z.array(NexusSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ClientSchema = z.object({
  id: z.string().optional(),
  personId: z.string(),
  hobbies: z.array(z.string()).default([]),
  favoriteSportsTeams: z.array(z.string()).default([]),
  paymentAccounts: z.array(PaymentAccountSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const PaymentSchedule = z.enum(["monthly", "quarterly", "semi-annually", "annually"]);

export const ClientPolicySchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  insuranceCompanyId: z.string(),
  paymentAccountId: z.string().optional(),
  policyName: z.string().min(1, "Policy name is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  premiumAmount: z.number().min(0, "Premium must be positive"),
  effectiveDate: z.string(), // ISO date
  renewalDate: z.string(), // ISO date
  paymentSchedule: PaymentSchedule,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// --- Inferred Types ---

export type Address = z.infer<typeof AddressSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type HouseholdMember = z.infer<typeof HouseholdMemberSchema>;
export type Household = z.infer<typeof HouseholdSchema>;
export type InsuranceCompany = z.infer<typeof InsuranceCompanySchema>;
export type PaymentAccount = z.infer<typeof PaymentAccountSchema>;
export type SitusType = z.infer<typeof SitusTypeSchema>;
export type NexusType = z.infer<typeof NexusTypeSchema>;
export type Situs = z.infer<typeof SitusSchema>;
export type Nexus = z.infer<typeof NexusSchema>;
export type Client = z.infer<typeof ClientSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type ClientPolicy = z.infer<typeof ClientPolicySchema>;
export type PaymentSchedule = z.infer<typeof PaymentSchedule>;

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
