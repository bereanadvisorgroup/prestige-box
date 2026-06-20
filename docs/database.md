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
    
    USERS {
        uuid uid PK "References auth.users"
        string email
        string role "Admin | Client"
    }
    PEOPLE {
        uuid id PK
        string firstName
        string lastName
        jsonb emails
        jsonb phones
    }
    CLIENTS {
        uuid id PK
        uuid personId FK
        jsonb employments
        jsonb liabilities
    }
    COMPANIES {
        uuid id PK
        string name
        string ein
        uuid[] clientIds
    }
    CLIENT_POLICIES {
        uuid id PK
        uuid clientId FK
        string policyName
        numeric premiumAmount
    }
```

## Core Entities

### `users`
- Maps to Supabase's internal `auth.users` table.
- Stores custom application-specific roles (`admin`, `client`) and basic profile data.

### `people`
- A master record of a physical person. This table tracks names, contact information (JSONB arrays), PII, and associated `addresses`.

### `clients`
- Represents a customer relationship. Every `client` maps to exactly one `person` (`personId`), but a `person` is not necessarily a `client` (e.g., they could be an associate or family member).
- Stores deep financial data such as employments, liabilities, mortgages, and specialized documents (PC, Life, Estate).

### `companies` & `insurance_companies`
- Separates general companies (employers, owned businesses) from specialized insurance providers (Life, Disability, Long Term Care).
- Many-to-Many relationships to clients are primarily handled via `uuid` arrays (e.g., `clientIds`).

## Drizzle ORM

The schema is defined in TypeScript at `src/db/schema.ts`. Drizzle Kit is used to generate SQL migrations from this file.

### Migrations & Pushing
- Schema updates are applied via `pnpm run drizzle-kit push` or `pnpm run drizzle-kit generate` depending on the environment.
- The `src/db/migrate.ts` file handles automated migration execution.

### Local Seeding
- To spin up a local environment quickly, a robust seeding script is provided at `src/db/seed.ts`.
- It utilizes `@faker-js/faker` to generate hundreds of realistic records across all tables (People, Companies, Policies, etc.).
- Run the seeder with: `pnpm run db:seed`.

## Security & Row Level Security (RLS)

All database access from the client side requires explicit Row Level Security policies.

- **Supabase Dashboards:** When testing queries in the Supabase Dashboard SQL Editor, RLS is bypassed. Always test via the client application or a dedicated authenticated service role.
- **Subquery Cache Optimization:** For performance, RLS rules avoid raw `auth.uid()` checks directly in the `USING` clause, instead preferring wrapped subqueries (e.g., `USING ((SELECT auth.uid()) = user_id)`) to enforce query caching.
- **Service Role:** The Supabase Service Role key is strictly reserved for secure Edge Functions or Next.js server actions that require administrative bypass. It is never exposed to the client bundle.
