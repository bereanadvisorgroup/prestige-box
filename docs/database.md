# Database

This document details the database schema, security rules, and data access patterns for the Prestige Box application.

## Schema Overview

The database is built on **PostgreSQL** hosted by Supabase. Schema definitions and migrations are managed by **Drizzle ORM**.

```mermaid
erDiagram
    USERS ||--o{ CLIENTS : "is managed by (role)"
    PEOPLE ||--o{ CLIENTS : "is a"
    PEOPLE ||--o{ HOUSEHOLDS : "belongs to"
    ADDRESSES ||--o{ PEOPLE : "lives at"
    COMPANIES ||--o{ CLIENTS : "employs/associated"
    CLIENTS ||--o{ CLIENT_POLICIES : "holds"
    LIFE_INSURANCE_COMPANIES ||--o{ CLIENT_POLICIES : "issues"
    DISABILITY_INSURANCE_COMPANIES ||--o{ CLIENT_POLICIES : "issues"
    LONG_TERM_CARE_INSURANCE ||--o{ CLIENT_POLICIES : "issues"
    CLIENTS ||--o{ ASSETS : "owns"
    ADDRESSES ||--o{ ASSETS : "located at"
    ASSETS ||--o{ ASSET_HISTORY : "tracks value changes in"
    
    COMPANIES ||--o{ COMPANY_VALUATION_HISTORY : "has valuations"
    COMPANIES ||--o{ COMPANY_OWNERS : "has owners"
    PEOPLE ||--o{ COMPANY_OWNERS : "owns equity"
    
    USERS ||--o{ TASKS : "creates"
    TASKS ||--o{ TASK_ASSIGNEES : "assigned to"
    USERS ||--o{ TASK_ASSIGNEES : "gets tasks"
    TASKS ||--o{ TASK_ASSOCIATIONS : "links entity"
    
    USERS ||--o{ NOTES : "writes"
    NOTES ||--o{ NOTES : "parent/replies"
    NOTES ||--o{ NOTE_ASSOCIATIONS : "links entity"
    NOTES ||--o{ NOTE_ATTACHMENTS : "has uploads"
    NOTES ||--o{ NOTE_REACTIONS : "gets emoji"
    NOTES ||--o{ NOTE_VOTES : "voted by"
    NOTES ||--o{ NOTE_NOTIFICATIONS : "alerts user"
    
    USERS ||--o{ CHANGE_HISTORY : "acts on (actorId)"
    REFERRAL_TYPES ||--o{ CLIENTS : "referred client"
    MONEY_MANAGERS ||--o{ CLIENTS : "manages accounts"
    RECORD_KEEPERS ||--o{ CLIENTS : "records accounts"
    CLIENTS ||--o{ LAW_FIRMS : "associated with"
    COMPANIES ||--o{ LAW_FIRMS : "associated with"
    CLIENTS ||--o{ ACCOUNTING_FIRMS : "associated with"
    COMPANIES ||--o{ ACCOUNTING_FIRMS : "associated with"
    CLIENTS ||--o{ ACTUARIAL_FIRMS : "associated with"
    COMPANIES ||--o{ ACTUARIAL_FIRMS : "associated with"
    CLIENTS ||--o{ BANKS : "associated with"
    COMPANIES ||--o{ BANKS : "associated with"
    CLIENTS ||--o{ PROPERTY_AND_CASUALTY_FIRMS : "associated with"
    COMPANIES ||--o{ PROPERTY_AND_CASUALTY_FIRMS : "associated with"
    
    USERS {
        uuid uid PK "References auth.users"
        string email
        string role "Admin | Advisor | Client"
        string firstName
        string lastName
        string photoURL
        timestamp createdAt
        timestamp updatedAt
    }
    ADDRESSES {
        uuid id PK
        string street1
        string street2
        string city
        string state
        string zipCode
        string country
        timestamp createdAt
        timestamp updatedAt
    }
    PEOPLE {
        uuid id PK
        string prefix
        string firstName
        string middleName
        string lastName
        string suffix
        string photoUrl
        jsonb emails
        jsonb phones
        jsonb driversLicense
        jsonb pii
        jsonb addresses
        uuid[] addressIds
        timestamp createdAt
        timestamp updatedAt
    }
    HOUSEHOLDS {
        uuid id PK
        string name
        uuid addressId FK "References addresses"
        jsonb memberIds
        timestamp createdAt
        timestamp updatedAt
    }
    LIFE_INSURANCE_COMPANIES {
        uuid id PK
        string name
        string websiteUrl
        string[] policyNames
        string phone
        uuid[] personIds
        uuid[] companyIds
        uuid[] clientIds
        timestamp createdAt
        timestamp updatedAt
    }
    DISABILITY_INSURANCE_COMPANIES {
        uuid id PK
        string name
        string websiteUrl
        string[] policyNames
        string phone
        uuid[] personIds
        uuid[] companyIds
        uuid[] clientIds
        timestamp createdAt
        timestamp updatedAt
    }
    LONG_TERM_CARE_INSURANCE {
        uuid id PK
        string name
        string websiteUrl
        string[] policyNames
        string phone
        uuid[] personIds
        uuid[] companyIds
        uuid[] clientIds
        timestamp createdAt
        timestamp updatedAt
    }
    CLIENTS {
        uuid id PK
        uuid personId FK "References people"
        uuid advisorId FK "References users"
        uuid referredById FK "Self-referencing parent client"
        string referredByType
        uuid referredByCompanyId FK "References companies"
        uuid referredByPersonId FK "References people"
        uuid referredByReferralTypeId FK "References referral_types"
        string[] hobbies
        string[] favoriteSportsTeams
        jsonb paymentAccounts
        jsonb familyMembers
        jsonb employments
        jsonb pcDocuments
        jsonb lifeDocuments
        jsonb ltcDocuments
        jsonb estateDocuments
        jsonb lifePolicies
        jsonb disabilityPolicies
        jsonb ltcPolicies
        jsonb moneyManagerAccounts
        jsonb recordKeeperAccounts
        jsonb liabilities
        jsonb mortgages
        timestamp createdAt
        timestamp updatedAt
    }
    COMPANIES {
        uuid id PK
        string name
        string dba
        string ein
        uuid addressId FK "References addresses"
        string website
        string phone
        jsonb situsRecords
        jsonb nexusRecords
        jsonb paymentAccounts
        jsonb lifeDocuments
        jsonb disabilityDocuments
        jsonb ltcDocuments
        numeric estimatedValue
        timestamp createdAt
        timestamp updatedAt
    }
    COMPANY_VALUATION_HISTORY {
        uuid id PK
        uuid companyId FK "References companies"
        numeric value
        timestamp valuationDate
        timestamp createdAt
        timestamp updatedAt
    }
    COMPANY_OWNERS {
        uuid id PK
        uuid companyId FK "References companies"
        uuid personId FK "References people"
        numeric ownershipPercentage
        timestamp createdAt
        timestamp updatedAt
    }
    CLIENT_POLICIES {
        uuid id PK
        uuid clientId FK "References clients"
        uuid lifeInsuranceCompanyId FK "References life_insurance_companies"
        uuid disabilityInsuranceCompanyId FK "References disability_insurance_companies"
        uuid longTermCareInsuranceId FK "References long_term_care_insurance"
        string paymentAccountId
        string policyName
        string policyNumber
        numeric premiumAmount
        timestamp effectiveDate
        timestamp renewalDate
        string paymentSchedule
        timestamp createdAt
        timestamp updatedAt
    }
    LAW_FIRMS {
        uuid id PK
        uuid[] personIds FK "References people"
        string firmName
        uuid firmAddressId FK "References addresses"
        string website
        string phone
        uuid[] clientIds
        uuid[] companyIds
        timestamp createdAt
        timestamp updatedAt
    }
    ACCOUNTING_FIRMS {
        uuid id PK
        uuid[] personIds FK "References people"
        string firmName
        uuid firmAddressId FK "References addresses"
        string website
        string phone
        uuid[] clientIds
        uuid[] companyIds
        timestamp createdAt
        timestamp updatedAt
    }
    ACTUARIAL_FIRMS {
        uuid id PK
        uuid[] personIds FK "References people"
        string firmName
        uuid firmAddressId FK "References addresses"
        string website
        string phone
        uuid[] clientIds
        uuid[] companyIds
        timestamp createdAt
        timestamp updatedAt
    }
    BANKS {
        uuid id PK
        uuid[] personIds FK "References people"
        string firmName
        uuid firmAddressId FK "References addresses"
        string website
        string phone
        uuid[] clientIds
        uuid[] companyIds
        timestamp createdAt
        timestamp updatedAt
    }
    PROPERTY_AND_CASUALTY_FIRMS {
        uuid id PK
        uuid[] personIds FK "References people"
        string firmName
        uuid firmAddressId FK "References addresses"
        string website
        string phone
        uuid[] clientIds
        uuid[] companyIds
        timestamp createdAt
        timestamp updatedAt
    }
    ASSETS {
        uuid id PK
        uuid clientId FK "References clients"
        string name
        string category
        string subType
        numeric currentValue
        string currency
        boolean isAutomated
        string institutionName
        uuid addressId FK "References addresses"
        timestamp createdAt
        timestamp updatedAt
    }
    ASSET_HISTORY {
        uuid id PK
        uuid assetId FK "References assets"
        numeric value
        timestamp recordedAt
        timestamp createdAt
    }
    KEYVALS {
        string id PK
        string value
        timestamp createdAt
        timestamp updatedAt
    }
    TASKS {
        uuid id PK
        string name
        string status "New | In Process | Waiting Input | Complete"
        string category "Other | Birthday | Wedding Anniversary | Policy Renewal"
        string priority "Low | Medium | High"
        string description "Tiptap HTML"
        jsonb attachments
        timestamp dueDate
        timestamp completeDate
        string source "manual | auto"
        string sourceType "birthday | anniversary | renewal"
        string sourceRefId "anchor ID"
        uuid createdBy FK "References users"
        timestamp createdAt
        timestamp updatedAt
    }
    TASK_ASSIGNEES {
        uuid id PK
        uuid taskId FK
        uuid userId FK "References users"
        timestamp createdAt
    }
    TASK_ASSOCIATIONS {
        uuid id PK
        uuid taskId FK
        string entityType "client | company"
        uuid entityId
        timestamp createdAt
    }
    NOTES {
        uuid id PK
        uuid parentId FK "self-reference"
        uuid rootId FK "self-reference"
        integer depth
        string title "Only on top-level notes"
        string body "Tiptap HTML"
        uuid authorId FK "References users"
        integer score
        boolean isDeleted
        timestamp createdAt
        timestamp updatedAt
    }
    NOTE_ATTACHMENTS {
        uuid id PK
        uuid noteId FK
        string kind "file | link"
        string fileUrl
        string fileName
        integer fileSize
        string mimeType
        string linkUrl
        string linkTitle
        string linkFavicon
        string linkProvider "google-drive | web"
        timestamp createdAt
    }
    NOTE_REACTIONS {
        uuid id PK
        uuid noteId FK
        uuid userId FK "References users"
        string emoji
        timestamp createdAt
    }
    NOTE_VOTES {
        uuid id PK
        uuid noteId FK
        uuid userId FK "References users"
        integer value "1 | -1"
        timestamp createdAt
    }
    NOTE_NOTIFICATIONS {
        uuid id PK
        uuid noteId FK
        uuid rootId FK
        uuid recipientId FK "References users"
        uuid actorId FK "References users"
        string actorName
        string type "mention | reply"
        string preview
        boolean isRead
        timestamp createdAt
    }
    CHANGE_HISTORY {
        uuid id PK
        string entityType "client | company | task"
        uuid entityId
        string subType "Profile | Life Insurance | etc"
        string action "created | updated | added | removed | deleted"
        string fieldName
        string fieldLabel
        string oldValue
        string newValue
        string summary
        uuid actorId FK "References users"
        string actorName
        timestamp changedAt
        timestamp createdAt
    }
    MONEY_MANAGERS {
        uuid id PK
        uuid[] personIds FK "References people"
        string firmName
        uuid firmAddressId FK "References addresses"
        string website
        string phone
        uuid[] clientIds
        uuid[] companyIds
        timestamp createdAt
        timestamp updatedAt
    }
    RECORD_KEEPERS {
        uuid id PK
        uuid[] personIds FK "References people"
        string firmName
        uuid firmAddressId FK "References addresses"
        string website
        string phone
        uuid[] clientIds
        uuid[] companyIds
        timestamp createdAt
        timestamp updatedAt
    }
    FINANCIAL_ACCOUNT_TYPES {
        uuid id PK
        string name
        timestamp createdAt
        timestamp updatedAt
    }
    CUSTODIANS {
        uuid id PK
        string name
        timestamp createdAt
        timestamp updatedAt
    }
    REFERRAL_TYPES {
        uuid id PK
        string name
        timestamp createdAt
        timestamp updatedAt
    }
```
```

## Core Entities

### `users`
- Maps to Supabase's internal `auth.users` table.
- Stores custom application-specific roles (`admin`, `advisor`, `client`) and basic profile details like name, phone, and profile photo URL.

### `people`
- A master record of a physical person. Tracks names, contact information (JSONB arrays), PII, and household associations.

### `clients`
- Represents a customer relationship. Maps to exactly one `person` (`personId`), and tracks advisor assignments (`advisorId` referencing `users.uid`).
- Stores deep financial profiles (employment, liabilities), assets, and insurance files.
- **Interests**: `hobbies` and `favoriteSportsTeams` stored as string arrays.
- **Client Referrals**: Supports multi-type referrals tracking via `referredById` (self-referencing client), `referredByType` (`'client' | 'company' | 'person' | 'referral_type'`), `referredByCompanyId` (references `companies.id`), `referredByPersonId` (references `people.id`), and `referredByReferralTypeId` (references `referral_types.id`).
- **Insurance Policies JSONB**: `lifePolicies`, `disabilityPolicies`, and `ltcPolicies` are stored as JSONB arrays of policy objects containing policy numbers, renewal dates, beneficiary lists, and uploaded documents.
- **Managed Accounts JSONB**: `moneyManagerAccounts` and `recordKeeperAccounts` are stored as JSONB arrays of account objects containing values, account numbers, and relationships to Money Managers, Record Keepers, Custodians, and Financial Account Types.
- **Estate Planning Documents**: The `estateDocuments` column is a structured JSONB repository supporting multiple estate planning document types with specific schema fields:
  - **Types**: Supports `Will`, `Revocable Trust`, `Irrevocable Trust`, and `Other`.
  - **Will Schema**: Tracks `effectiveDate` (YYYY-MM-DD), `beneficiaries` (text), and a `files` array of documents (`id`, `name`, `url`, `uploadedAt`).
  - **Trust Schema**: Tracks the `trustName`, `effectiveDate`, `amendmentDate`, `attorneyFirmId` (linking to a law firm), `grantor` and `trustees` (party reference objects with `kind` as `person` or `company` and `id` linking to their record), `beneficiaries` (text), and the `files` array.
  - **Other Schema**: Tracks custom `description` (text) and the `files` array.

### `client_policies` & `insurance_vendors`
- **Policies**: `client_policies` tracks a client's Life, Disability, and Long-Term Care policies, detailing policy numbers, premium amounts, effective and renewal dates, and payment schedules (used for global dashboards and relationship mapping).
- **Vendors**: Tracks insurance companies (`life_insurance_companies`, `disability_insurance_companies`, `long_term_care_insurance`) with name, website, phone contacts, and relationships to individuals and corporate clients.

### `money_managers` & `record_keepers`
- Tracks external asset management firms and record keeper companies.
- Includes references to associated contact persons (`personIds` referencing `people.id`), addresses (`firmAddressId`), websites, phone numbers, and arrays of associated client IDs and company IDs.

### `financial_account_types`, `custodians`, & `referral_types`
- Global administrator-managed lookup tables.
- **`financial_account_types`**: Stores investment account categories (e.g. 401(k), IRA, Taxable).
- **`custodians`**: Stores custodians (e.g. Charles Schwab, Fidelity).
- **`referral_types`**: Stores types of referral channels (e.g. CPA, Attorney, Web Search).

### `companies` & sub-tables (`company_valuation_history`, `company_owners`)
- Tracks general corporate clients and business entities.
- Upgraded with fields for corporate details (situs/nexus address, website, phone, payment accounts) and document categories (`lifeDocuments`, `disabilityDocuments`, `ltcDocuments`).
- **Valuation History**: Logs historical valuation snapshots in `company_valuation_history` to build valuation curves.
- **Ownership Equity**: Tracks cap table records in `company_owners` tying physical individuals (`people.id`) to corporate entities with decimal ownership percentages.

### `tasks` & sub-tables (`task_assignees`, `task_associations`)
- Manages standard advisory workflows.
- Idempotency is strictly guarded via a unique database index: `uq_tasks_auto_anchor` (`sourceType`, `sourceRefId`), preventing duplicate generation of birthday, anniversary, or policy renewal tasks.
- **Assignees**: Links multiple active users to a single task via `task_assignees`.
- **Contextual Links**: Connects a task to clients or companies using `task_associations`.

### `notes` & sub-tables (`note_attachments`, `note_reactions`, `note_votes`, `note_notifications`)
- reddit-style nested threaded workspace.
- **Hierarchical Self-References**: Each record points to a parent note (`parentId` for direct replies) and a root thread (`rootId` for depth-independent rendering).
- **Rich attachments**: Links static binary uploads or dynamic web-crawled/Google Drive links via `note_attachments`.
- **Community Ratings**: Tracks up/down voting scores through `note_votes` (using the `value` column) and emoji counts in `note_reactions`.
- **In-App Notifications**: Stores unread mention/reply triggers in `note_notifications` linked to user recipients.

### `change_history`
- System-wide audit log mapping all mutations across CRM entities (clients, companies, tasks).
- Logs the semantic sub-type (e.g. Profile, Life Insurance, Valuation), action (`created`, `updated`, `added`, `removed`, `deleted`), specific changed fields with machine and human-readable names (`fieldName`, `fieldLabel`), before/after string snapshots (`oldValue`, `newValue`), a custom text `summary`, and details of the actor (`actorId`, `actorName`) and timestamp.

---

## Drizzle ORM

The schema is defined in TypeScript at `src/db/schema.ts`. Drizzle Kit is used to generate SQL migrations.

### Migrations & Pushing
- Schema updates are applied via `pnpm drizzle-kit push` or `pnpm drizzle-kit generate` depending on the environment.
- The `src/db/migrate.ts` file handles automated migration execution.

### Local Seeding
- To spin up a local environment quickly, a seeding script is provided at `src/db/seed.ts`.
- Generates realistic records across all tables (People, Companies, Policies, Notes, Tasks, and Valuations).
- Run the seeder with: `pnpm run db:seed`.

---

## Security & Row Level Security (RLS)

All database access from the client side requires explicit Row Level Security policies.

- **MFA (AAL2) Enforcement**: Access to highly sensitive tables (e.g., `assets` and `asset_history`) requires strict Multi-Factor Authentication. Policies verify that the Authenticator Assurance Level (`aal`) claim in the session JWT is `'aal2'`: `USING (((SELECT auth.jwt() ->> 'aal') = 'aal2'))`. Requests made with only single-factor authentication (`aal1`) are rejected at the database level.
- **Collaborative Modules RLS**: Tables like `notes`, `tasks`, `change_history`, and their related tables allow read/write access to all `authenticated` users. More granular business logic validation (e.g., preventing a client from reading internal notes) is enforced at the application level to support rich team collaboration.
- **Subquery Cache Optimization**: RLS rules avoid raw `auth.uid()` checks directly in the `USING` clause, instead preferring wrapped subqueries (e.g., `USING ((SELECT auth.uid()) = user_id)`) to enforce query caching.
- **Service Role**: The Supabase Service Role key is strictly reserved for secure Edge Functions or Next.js server actions that require administrative bypass. It is never exposed to the client bundle.

