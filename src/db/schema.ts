import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
  socialMedia: jsonb("socialMedia").default(sql`'[]'::jsonb`),
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
  members: jsonb("memberIds").default(sql`'[]'::jsonb`),
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
  personTitles: jsonb("personTitles").default(sql`'{}'::jsonb`).notNull(),
  companyIds: uuid("companyIds").array().default(sql`'{}'::uuid[]`),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  logoUrl: text("logoUrl"),
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
  personTitles: jsonb("personTitles").default(sql`'{}'::jsonb`).notNull(),
  companyIds: uuid("companyIds").array().default(sql`'{}'::uuid[]`),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  logoUrl: text("logoUrl"),
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
  personTitles: jsonb("personTitles").default(sql`'{}'::jsonb`).notNull(),
  companyIds: uuid("companyIds").array().default(sql`'{}'::uuid[]`),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 6. Clients Table
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("personId").notNull(),
  advisorId: uuid("advisorId"), // users.uid of the advisor/admin who services this client
  referredById: uuid("referredById"), // Self-referencing ID for referrals
  referredByType: text("referredByType"), // 'client' | 'company' | 'person' | 'referral_type' | 'event'
  referredByCompanyId: uuid("referredByCompanyId").references(() => companies.id, { onDelete: "set null" }),
  referredByPersonId: uuid("referredByPersonId").references(() => people.id, { onDelete: "set null" }),
  referredByReferralTypeId: uuid("referredByReferralTypeId").references(() => referralTypes.id, {
    onDelete: "set null",
  }),
  referredByEventId: uuid("referredByEventId").references(() => events.id, { onDelete: "set null" }),
  referredByAdvisorId: uuid("referredByAdvisorId").references(() => users.uid, { onDelete: "set null" }),
  hobbies: text("hobbies").array().default(sql`'{}'::text[]`),
  favoriteSportsTeams: text("favoriteSportsTeams").array().default(sql`'{}'::text[]`),
  paymentAccounts: jsonb("paymentAccounts").default(sql`'[]'::jsonb`),
  familyMembers: jsonb("familyMembers").default(sql`'[]'::jsonb`),
  employments: jsonb("employments").default(sql`'[]'::jsonb`),
  pcDocuments: jsonb("pcDocuments").default(sql`'[]'::jsonb`),
  lifeDocuments: jsonb("lifeDocuments").default(sql`'[]'::jsonb`),
  ltcDocuments: jsonb("ltcDocuments").default(sql`'[]'::jsonb`),
  estateDocuments: jsonb("estateDocuments").default(sql`'[]'::jsonb`),
  lifePolicies: jsonb("lifePolicies").default(sql`'[]'::jsonb`),
  disabilityPolicies: jsonb("disabilityPolicies").default(sql`'[]'::jsonb`),
  ltcPolicies: jsonb("ltcPolicies").default(sql`'[]'::jsonb`),
  moneyManagerAccounts: jsonb("moneyManagerAccounts").default(sql`'[]'::jsonb`),
  recordKeeperAccounts: jsonb("recordKeeperAccounts").default(sql`'[]'::jsonb`),
  liabilities: jsonb("liabilities").default(sql`'[]'::jsonb`),
  mortgages: jsonb("mortgages").default(sql`'[]'::jsonb`),
  driversLicense: jsonb("driversLicense").default(sql`'{}'::jsonb`),
  pii: jsonb("pii").default(sql`'{}'::jsonb`),
  documentUrl: text("documentUrl"),
  notebookUrl: text("notebookUrl"),
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
  advisorId: uuid("advisorId"), // users.uid of the advisor/admin assigned to this company
  situsRecords: jsonb("situsRecords").default(sql`'[]'::jsonb`),
  nexusRecords: jsonb("nexusRecords").default(sql`'[]'::jsonb`),
  paymentAccounts: jsonb("paymentAccounts").default(sql`'[]'::jsonb`),
  lifeDocuments: jsonb("lifeDocuments").default(sql`'[]'::jsonb`),
  disabilityDocuments: jsonb("disabilityDocuments").default(sql`'[]'::jsonb`),
  ltcDocuments: jsonb("ltcDocuments").default(sql`'[]'::jsonb`),
  logoUrl: text("logoUrl"),
  socialMedia: jsonb("socialMedia").default(sql`'[]'::jsonb`),
  documentUrl: text("documentUrl"),
  notebookUrl: text("notebookUrl"),
  estimatedValue: numeric("estimatedValue").notNull().default("0.00"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 7b. Company Owners Table
export const companyOwners = pgTable("company_owners", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("companyId")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  personId: uuid("personId")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  ownershipPercentage: numeric("ownershipPercentage").notNull().default("0.00"),
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
  personTitles: jsonb("personTitles").default(sql`'{}'::jsonb`).notNull(),
  firmName: text("firmName").notNull(),
  firmAddressId: uuid("firmAddressId"),
  website: text("website"),
  phone: text("phone"),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  companyIds: uuid("companyIds").array().default(sql`'{}'::uuid[]`),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 10. Accounting Firms Table
export const accountingFirms = pgTable("accounting_firms", {
  id: uuid("id").primaryKey().defaultRandom(),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  personTitles: jsonb("personTitles").default(sql`'{}'::jsonb`).notNull(),
  firmName: text("firmName").notNull(),
  firmAddressId: uuid("firmAddressId"),
  website: text("website"),
  phone: text("phone"),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  companyIds: uuid("companyIds").array().default(sql`'{}'::uuid[]`),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 11. Actuarial Firms Table
export const actuarialFirms = pgTable("actuarial_firms", {
  id: uuid("id").primaryKey().defaultRandom(),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  personTitles: jsonb("personTitles").default(sql`'{}'::jsonb`).notNull(),
  firmName: text("firmName").notNull(),
  firmAddressId: uuid("firmAddressId"),
  website: text("website"),
  phone: text("phone"),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  companyIds: uuid("companyIds").array().default(sql`'{}'::uuid[]`),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 12. Banks Table
export const banks = pgTable("banks", {
  id: uuid("id").primaryKey().defaultRandom(),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  personTitles: jsonb("personTitles").default(sql`'{}'::jsonb`).notNull(),
  firmName: text("firmName").notNull(),
  firmAddressId: uuid("firmAddressId"),
  website: text("website"),
  phone: text("phone"),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  companyIds: uuid("companyIds").array().default(sql`'{}'::uuid[]`),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 13. Property And Casualty Firms Table
export const propertyAndCasualtyFirms = pgTable("property_and_casualty_firms", {
  id: uuid("id").primaryKey().defaultRandom(),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  personTitles: jsonb("personTitles").default(sql`'{}'::jsonb`).notNull(),
  firmName: text("firmName").notNull(),
  firmAddressId: uuid("firmAddressId"),
  website: text("website"),
  phone: text("phone"),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  companyIds: uuid("companyIds").array().default(sql`'{}'::uuid[]`),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 14. Money Managers Table
export const moneyManagers = pgTable("money_managers", {
  id: uuid("id").primaryKey().defaultRandom(),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  personTitles: jsonb("personTitles").default(sql`'{}'::jsonb`).notNull(),
  firmName: text("firmName").notNull(),
  firmAddressId: uuid("firmAddressId"),
  website: text("website"),
  phone: text("phone"),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  companyIds: uuid("companyIds").array().default(sql`'{}'::uuid[]`),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 15. Record Keepers Table
export const recordKeepers = pgTable("record_keepers", {
  id: uuid("id").primaryKey().defaultRandom(),
  personIds: uuid("personIds").array().notNull().default(sql`'{}'::uuid[]`),
  personTitles: jsonb("personTitles").default(sql`'{}'::jsonb`).notNull(),
  firmName: text("firmName").notNull(),
  firmAddressId: uuid("firmAddressId"),
  website: text("website"),
  phone: text("phone"),
  clientIds: uuid("clientIds").array().default(sql`'{}'::uuid[]`),
  companyIds: uuid("companyIds").array().default(sql`'{}'::uuid[]`),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 15b. Financial Account Types Table
export const financialAccountTypes = pgTable("financial_account_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 15c. Custodians Table
export const custodians = pgTable("custodians", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 15d. Referral Types Table
export const referralTypes = pgTable("referral_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 15e. Events Table
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  addressId: uuid("addressId").references(() => addresses.id, { onDelete: "set null" }),
  startDate: timestamp("startDate", { withTimezone: true }),
  endDate: timestamp("endDate", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 16. Assets Table
export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("clientId").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull().default("Real Estate and Fixed Physical Assets"),
  subType: text("subType").notNull(),
  currentValue: numeric("currentValue").notNull().default("0.00"),
  currency: text("currency").notNull().default("USD"),
  isAutomated: boolean("isAutomated").notNull().default(false),
  institutionName: text("institutionName").notNull().default("Manual"),
  addressId: uuid("addressId"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 17. Asset History Table
export const assetHistory = pgTable("asset_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  assetId: uuid("assetId").notNull(),
  value: numeric("value").notNull().default("0.00"),
  recordedAt: timestamp("recordedAt", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
});

// 18. Key-Value Settings Table
export const keyvals = pgTable("keyvals", {
  id: text("id").primaryKey(),
  value: text("value").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 20. Change History Table (audit log for clients & companies)
export const changeHistory = pgTable("change_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entityType").notNull(), // 'client' | 'company'
  entityId: uuid("entityId").notNull(), // the client or company the change belongs to
  subType: text("subType").notNull(), // semantic area, e.g. 'Profile', 'Life Insurance', 'Valuation'
  action: text("action").notNull(), // 'created' | 'updated' | 'added' | 'removed' | 'deleted'
  fieldName: text("fieldName"), // machine field name (null for add/remove events)
  fieldLabel: text("fieldLabel"), // human-readable field name
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  summary: text("summary"), // e.g. 'Life Insurance policy added for client'
  actorId: uuid("actorId"), // users.uid of the acting user (nullable for system writes)
  actorName: text("actorName"), // snapshot of the actor's display name; 'System' fallback
  changedAt: timestamp("changedAt", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
});

// 19. Company Valuation History Table
export const companyValuationHistory = pgTable("company_valuation_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("companyId")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  value: numeric("value").notNull().default("0.00"),
  valuationDate: timestamp("valuationDate", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 21. Tasks Table (task management for admins & advisors)
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  status: text("status").notNull().default("New"), // New | In Process | Waiting Input | Complete
  category: text("category").notNull().default("Other"), // Other | Birthday | Wedding Anniversary | Policy Renewal
  priority: text("priority").notNull().default("Low"), // Low | Medium | High
  description: text("description"), // Tiptap HTML
  attachments: jsonb("attachments").default(sql`'[]'::jsonb`),
  dueDate: timestamp("dueDate", { withTimezone: true }).notNull(),
  completeDate: timestamp("completeDate", { withTimezone: true }), // set on Complete, cleared otherwise
  source: text("source").notNull().default("manual"), // manual | auto
  sourceType: text("sourceType"), // birthday | anniversary | renewal (auto tasks only)
  sourceRefId: text("sourceRefId"), // anchor id (personId / familyMember id / policyId)
  createdBy: uuid("createdBy"), // users.uid of creator (null for system/auto)
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 22. Task Assignees (many-to-many: tasks ↔ admin/advisor users)
export const taskAssignees = pgTable("task_assignees", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("taskId")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: uuid("userId").notNull(), // users.uid
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
});

// 23. Task Associations (many-to-many: tasks ↔ clients/companies)
export const taskAssociations = pgTable("task_associations", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("taskId")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  entityType: text("entityType").notNull(), // client | company
  entityId: uuid("entityId").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
});

// 24. Notes Table (Reddit-style threaded notes for admins & advisors)
// A top-level note (depth 0) carries a `title`; replies (depth 1) and
// sub-replies (depth 2) reference their parent and share the same `rootId`
// so an entire thread can be fetched in a single query.
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parentId"), // null for top-level notes; references notes.id otherwise
  rootId: uuid("rootId"), // the top-level note this belongs to (equals id for depth 0)
  depth: integer("depth").notNull().default(0), // 0 = note, 1 = reply, 2 = sub-reply
  title: text("title"), // present on top-level notes only
  body: text("body").notNull().default(""), // Tiptap HTML (text + emojis)
  authorId: uuid("authorId"), // users.uid of the author (null for system)
  score: integer("score").notNull().default(0), // denormalized sum of votes
  isDeleted: boolean("isDeleted").notNull().default(false), // soft delete
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 25. Note Associations (many-to-many: notes ↔ clients/companies).
// A note with no association rows is a standalone note.
export const noteAssociations = pgTable("note_associations", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("noteId")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  entityType: text("entityType").notNull(), // client | company
  entityId: uuid("entityId").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
});

// 26. Note Attachments (uploaded files and pasted link previews)
export const noteAttachments = pgTable("note_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("noteId")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("file"), // file | link
  // file fields (Supabase Storage `documents` bucket)
  fileUrl: text("fileUrl"),
  fileName: text("fileName"),
  fileSize: integer("fileSize"),
  mimeType: text("mimeType"),
  // link fields (pasted URL / Google Drive preview)
  linkUrl: text("linkUrl"),
  linkTitle: text("linkTitle"),
  linkFavicon: text("linkFavicon"),
  linkProvider: text("linkProvider"), // google-drive | web
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
});

// 27. Note Reactions (one row per user+emoji on a note/reply)
export const noteReactions = pgTable("note_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("noteId")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  userId: uuid("userId").notNull(), // users.uid
  emoji: text("emoji").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
});

// 28. Note Votes (Reddit-style up/down; one row per user+note)
export const noteVotes = pgTable("note_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("noteId")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  userId: uuid("userId").notNull(), // users.uid
  value: integer("value").notNull().default(0), // -1 | 1
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
});

// 29. Note Notifications (@mentions and replies to your notes)
export const noteNotifications = pgTable("note_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("noteId")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  rootId: uuid("rootId"), // thread to deep-link to
  recipientId: uuid("recipientId").notNull(), // users.uid being notified
  actorId: uuid("actorId"), // users.uid who triggered the notification
  actorName: text("actorName"), // snapshot of actor display name
  type: text("type").notNull(), // mention | reply
  preview: text("preview"), // short plain-text snippet
  isRead: boolean("isRead").notNull().default(false),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
});

// 30. Workflow Templates (reusable definitions created by admins)
export const workflowTemplates = pgTable("workflow_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"), // Tiptap HTML
  createdBy: uuid("createdBy").references(() => users.uid, { onDelete: "set null" }),
  graph: jsonb("graph").notNull().default(sql`'{"nodes": [], "edges": []}'::jsonb`),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 31. Workflow Template Steps (ordered steps belonging to a template)
export const workflowTemplateSteps = pgTable("workflow_template_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("templateId")
    .notNull()
    .references(() => workflowTemplates.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sortOrder").notNull().default(0),
  setDueDate: boolean("setDueDate").notNull().default(false),
  dueDays: integer("dueDays"), // 1-7, only when setDueDate
  dueDateBase: text("dueDateBase"), // workflow_start | after_last_step
  priority: text("priority").notNull().default("None"), // None | Low | Medium | High
  description: text("description"), // Tiptap HTML
  responsibility: text("responsibility").notNull().default("advisor"), // advisor | client
  attachments: jsonb("attachments").notNull().default(sql`'[]'::jsonb`),
  outcomes: jsonb("outcomes").notNull().default(sql`'[]'::jsonb`),
  positionX: numeric("positionX").default("0"),
  positionY: numeric("positionY").default("0"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 32. Workflow Instances (a snapshot copy of a template assigned to a client or company)
export const workflowInstances = pgTable("workflow_instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("templateId").references(() => workflowTemplates.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"), // Tiptap HTML (snapshot)
  entityType: text("entityType").notNull(), // client | company
  entityId: uuid("entityId").notNull(),
  startDate: timestamp("startDate", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("createdBy").references(() => users.uid, { onDelete: "set null" }),
  completedAt: timestamp("completedAt", { withTimezone: true }),
  completedBy: uuid("completedBy").references(() => users.uid, { onDelete: "set null" }),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 33. Workflow Instance Steps (snapshot of template steps with completion tracking)
export const workflowInstanceSteps = pgTable("workflow_instance_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  instanceId: uuid("instanceId")
    .notNull()
    .references(() => workflowInstances.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sortOrder").notNull().default(0),
  setDueDate: boolean("setDueDate").notNull().default(false),
  dueDays: integer("dueDays"),
  dueDateBase: text("dueDateBase"), // workflow_start | after_last_step
  priority: text("priority").notNull().default("None"),
  description: text("description"), // Tiptap HTML
  responsibility: text("responsibility").notNull().default("advisor"),
  attachments: jsonb("attachments").notNull().default(sql`'[]'::jsonb`),
  dueDate: timestamp("dueDate", { withTimezone: true }), // resolved due date for this instance
  completedAt: timestamp("completedAt", { withTimezone: true }),
  completedBy: uuid("completedBy").references(() => users.uid, { onDelete: "set null" }),
  templateStepId: uuid("templateStepId").references(() => workflowTemplateSteps.id, { onDelete: "set null" }),
  outcomes: jsonb("outcomes").notNull().default(sql`'[]'::jsonb`),
  selectedOutcome: jsonb("selectedOutcome"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 19. Opportunity Pipelines
export const opportunityPipelines = pgTable("opportunity_pipelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  isActive: boolean("isActive").notNull().default(true),
  hasFlatFee: boolean("hasFlatFee").notNull().default(false),
  hasAum: boolean("hasAum").notNull().default(false),
  hasLifeInsurance: boolean("hasLifeInsurance").notNull().default(false),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 20. Opportunity Pipeline Stages
export const opportunityPipelineStages = pgTable("opportunity_pipeline_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  pipelineId: uuid("pipelineId")
    .notNull()
    .references(() => opportunityPipelines.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 21. Opportunities
export const opportunities = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("clientId").references(() => clients.id, { onDelete: "cascade" }),
  companyId: uuid("companyId").references(() => companies.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull().default("0.00"),
  flatFee: numeric("flatFee").notNull().default("0.00"),
  aumAmount: numeric("aumAmount").notNull().default("0.00"),
  aumPercentage: numeric("aumPercentage").notNull().default("0.00"),
  lifeInsurance: numeric("lifeInsurance").notNull().default("0.00"),
  targetCloseDate: timestamp("targetCloseDate", { withTimezone: true }),
  pipelineId: uuid("pipelineId")
    .notNull()
    .references(() => opportunityPipelines.id, { onDelete: "restrict" }),
  stageId: uuid("stageId")
    .notNull()
    .references(() => opportunityPipelineStages.id, { onDelete: "restrict" }),
  probabilityWin: integer("probabilityWin").notNull().default(0),
  notes: text("notes"), // WYSIWYG
  resultStatus: text("resultStatus"), // 'TRASH' | 'WON' | 'LOST' | null/empty for active
  resultNotes: text("resultNotes"), // WYSIWYG
  closeDate: timestamp("closeDate", { withTimezone: true }),
  updatedById: uuid("updatedById").references(() => users.uid, { onDelete: "set null" }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 34. Teams Table
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// 35. Team Members Table (Junction table between teams and users)
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("teamId")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: uuid("userId")
    .notNull()
    .references(() => users.uid, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
});

// 36. Opportunity History Table
export const opportunityHistory = pgTable("opportunity_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  opportunityId: uuid("opportunityId")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'created' | 'target_close_date_change'
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  reason: text("reason"),
  actorId: uuid("actorId").references(() => users.uid, { onDelete: "set null" }),
  actorName: text("actorName").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
});
