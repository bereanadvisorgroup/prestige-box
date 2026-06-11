import { sql } from "drizzle-orm";
import { jsonb, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// 1. Users Table
export const users = pgTable("users", {
  uid: uuid("uid").primaryKey(),
  email: text("email").unique().notNull(),
  firstName: text("firstName"),
  lastName: text("lastName"),
  role: text("role").notNull().default("client"),
  photoURL: text("photoURL"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 2. Addresses Table
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  street1: text("street1").notNull(),
  street2: text("street2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zipCode").notNull(),
  country: text("country").default("USA"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 3. People Table
export const people = pgTable("people", {
  id: uuid("id").primaryKey().defaultRandom(),
  prefix: text("prefix"),
  firstName: text("firstName").notNull(),
  middleName: text("middleName"),
  lastName: text("lastName").notNull(),
  suffix: text("suffix"),
  photoUrl: text("photoUrl"),
  emails: jsonb("emails").default(sql`'[]'::jsonb`),
  phones: jsonb("phones").default(sql`'[]'::jsonb`),
  driversLicense: jsonb("driversLicense").default(sql`'{}'::jsonb`),
  pii: jsonb("pii").default(sql`'{}'::jsonb`),
  addresses: jsonb("addresses").default(sql`'[]'::jsonb`),
  addressIds: uuid("addressIds").array().default(sql`'{}'::uuid[]`),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 4. Households Table
export const households = pgTable("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  addressId: uuid("addressId"),
  memberIds: jsonb("memberIds").default(sql`'[]'::jsonb`),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 5. Life Insurance Companies Table
export const lifeInsuranceCompanies = pgTable("life_insurance_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  websiteUrl: text("websiteUrl").notNull(),
  policyNames: text("policyNames").array().default(sql`'{}'::text[]`),
  phone: text("phone"),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 5b. Disability Insurance Companies Table
export const disabilityInsuranceCompanies = pgTable("disability_insurance_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  websiteUrl: text("websiteUrl").notNull(),
  policyNames: text("policyNames").array().default(sql`'{}'::text[]`),
  phone: text("phone"),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 5c. Long Term Care Insurance Table
export const longTermCareInsurance = pgTable("long_term_care_insurance", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  websiteUrl: text("websiteUrl").notNull(),
  policyNames: text("policyNames").array().default(sql`'{}'::text[]`),
  phone: text("phone"),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 6. Clients Table
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("personId").notNull(),
  hobbies: text("hobbies").array().default(sql`'{}'::text[]`),
  favoriteSportsTeams: text("favoriteSportsTeams").array().default(sql`'{}'::text[]`),
  paymentAccounts: jsonb("paymentAccounts").default(sql`'[]'::jsonb`),
  familyMembers: jsonb("familyMembers").default(sql`'[]'::jsonb`),
  employments: jsonb("employments").default(sql`'[]'::jsonb`),
  pcDocuments: jsonb("pcDocuments").default(sql`'[]'::jsonb`),
  lifeDocuments: jsonb("lifeDocuments").default(sql`'[]'::jsonb`),
  estateDocuments: jsonb("estateDocuments").default(sql`'[]'::jsonb`),
  liabilities: jsonb("liabilities").default(sql`'[]'::jsonb`),
  mortgages: jsonb("mortgages").default(sql`'[]'::jsonb`),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 7. Companies Table
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  dba: text("dba"),
  ein: text("ein"),
  addressId: uuid("addressId"),
  website: text("website"),
  phone: text("phone"),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  situsRecords: jsonb("situsRecords").default(sql`'[]'::jsonb`),
  nexusRecords: jsonb("nexusRecords").default(sql`'[]'::jsonb`),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 8. Client Policies Table
export const clientPolicies = pgTable("client_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("clientId").notNull(),
  lifeInsuranceCompanyId: uuid("lifeInsuranceCompanyId"),
  disabilityInsuranceCompanyId: uuid("disabilityInsuranceCompanyId"),
  longTermCareInsuranceId: uuid("longTermCareInsuranceId"),
  paymentAccountId: text("paymentAccountId"),
  policyName: text("policyName").notNull(),
  policyNumber: text("policyNumber").notNull(),
  premiumAmount: numeric("premiumAmount").notNull().default("0.00"),
  effectiveDate: timestamp("effectiveDate", { withTimezone: true }).notNull(),
  renewalDate: timestamp("renewalDate", { withTimezone: true }).notNull(),
  paymentSchedule: text("paymentSchedule").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 9. Law Firms Table
export const lawFirms = pgTable("law_firms", {
  id: uuid("id").primaryKey().defaultRandom(),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  firmName: text("firmName").notNull(),
  firmAddressId: uuid("firmAddressId"),
  website: text("website"),
  phone: text("phone"),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 10. Accounting Firms Table
export const accountingFirms = pgTable("accounting_firms", {
  id: uuid("id").primaryKey().defaultRandom(),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  firmName: text("firmName").notNull(),
  firmAddressId: uuid("firmAddressId"),
  website: text("website"),
  phone: text("phone"),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 11. Actuarial Firms Table
export const actuarialFirms = pgTable("actuarial_firms", {
  id: uuid("id").primaryKey().defaultRandom(),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  firmName: text("firmName").notNull(),
  firmAddressId: uuid("firmAddressId"),
  website: text("website"),
  phone: text("phone"),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 12. Banks Table
export const banks = pgTable("banks", {
  id: uuid("id").primaryKey().defaultRandom(),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  firmName: text("firmName").notNull(),
  firmAddressId: uuid("firmAddressId"),
  website: text("website"),
  phone: text("phone"),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 13. Property And Casualty Firms Table
export const propertyAndCasualtyFirms = pgTable("property_and_casualty_firms", {
  id: uuid("id").primaryKey().defaultRandom(),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  firmName: text("firmName").notNull(),
  firmAddressId: uuid("firmAddressId"),
  website: text("website"),
  phone: text("phone"),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 14. Money Managers Table
export const moneyManagers = pgTable("money_managers", {
  id: uuid("id").primaryKey().defaultRandom(),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  firmName: text("firmName").notNull(),
  firmAddressId: uuid("firmAddressId"),
  website: text("website"),
  phone: text("phone"),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});
