# AI Agent Instructions

You are an expert front-end and full-stack engineer, specializing in Next.js, React, Tailwind CSS, ShadCN UI, and Supabase. You focus on building scalable, performant, and accessible modern web applications with a beautiful design.

This file (`AGENTS.md`) provides technical context, coding standards, and architectural conventions for this project.

## Tech Stack Overview

- **Framework:** Next.js (App Router), React 19
- **Styling:** Tailwind CSS 4
- **UI Components:** ShadCN UI, Radix UI, Base UI, Lucide React (for icons)
- **State Management & Data:** Zustand (global state), TanStack React Query (server state)
- **Form Handling & Validation:** React Hook Form, Zod
- **Backend & Database:** Supabase
- **Linting & Formatting:** Biome
- **Deployment CI/CD:** Vercel
- **Version Control:** Git, GitHub
- **Environments:** git branch > [Vercel Deployments]: dev > [none], preview > [preview], pre-prod > [Pre Prod], main > [Production] - note that there is a production deployment associated with the main branch in Vercel.

## General Coding Principles

- **TypeScript Standard:** Write clear, strictly typed TypeScript code. Avoid `any`. Use descriptive interfaces and precise types.
- **Modularity:** Keep functions small and single-purpose. Break out reusable logic into custom hooks (`src/hooks`) and helpers (`src/lib`).
- **Readability & Maintainability:** Prioritize code that is easy to read. Leave concise comments for complex logic.
- **Performance:** Be mindful of re-renders. Use Next.js Server Components by default. Only add `"use client"` when interactivity, client-side hooks, or browser APIs are required.
- **Commit & PR Guidelines:** Use descriptive Git commit messages and Always use Git Worktrees when running parallel agent threads to avoid file access conflicts.

## Frontend & UI Architecture (Next.js + ShadCN)

- **Design Aesthetics:** The project mandates a consistent, *premium modern look and feel*. Always prioritize sleek, dynamic aesthetics with smooth transitions (e.g., hover effects, micro-animations) and accessible, scalable UI patterns.
- **Styling Configuration:** Use utility classes via Tailwind CSS. Leverage the `cn()` utility (`clsx` + `tailwind-merge`) to conditionally combine tailwind classes, especially in reusable components.
- **ShadCN Principles:** Use existing ShadCN components wherever possible rather than building custom UI elements from scratch. When creating new UI functionality, ensure it fits visually with the rest of the ShadCN-based library.
- **Data Fetching:** For simple data access, utilize Next.js Server Components. For complex client-side interactions, pagination, or caching, use TanStack React Query.
- **Forms:** Always use React Hook Form paired with Zod resolvers to ensure type-safe and performant complex inputs.
- **Data Tables Design Standard:** All data tables in the application must strictly adhere to the following UI standards:
  - **First Column Navigation:** The text in the first column of each table must link to the detailed landing page of that entity, followed immediately by an `ArrowUpRight` navigation icon.
  - **Direct Actions (Last Column):** Do NOT use ellipse menus (`DropdownMenu`/`MoreHorizontal`). The last column must display direct action buttons: an Edit button (`Pencil` icon) linking to the edit page, and a Delete button (`Trash2` icon).
  - **Conditional Delete:** The Delete button must be enabled only if the record is not associated/linked to any other entity in the system. If it is linked, display the Delete button but styled as disabled and colored grey (`text-muted-foreground/40 cursor-not-allowed`). Relationship/association checks should be computed on the server-side Page and passed as `isLinked` in table row records.

## Backend Architecture (Supabase)

- **Modularity:** Isolate Supabase initializations and interactions into dedicated service files or custom hooks. Do not spread direct database calls across your UI components.
- **Edge Functions:** Use Supabase Edge Functions for background processing, secure administrative acts, or logic that cannot safely be executed via client or simple Next.js API routes.

### Supabase Security & RLS Policy Guidelines

You must strictly adhere to the following architectural patterns and constraints whenever writing, updating, or reviewing Supabase database schemas and security rules.

#### 1. Local-First Migration Strategy

- **No Dashboard UI Assumptions:** Never instruct the user to configure security rules via the Supabase dashboard UI.
- **Pure SQL Migrations:** All schema creation and Row Level Security (RLS) policies must be written as clean, explicit SQL migration scripts meant for the Supabase CLI.
- **Default Deny:** Always include `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;` immediately after table creation.

#### 2. Policy Performance & Syntax Patterns

- **Role Isolation:** Always use the `TO` clause (`TO authenticated`, `TO anon`) to filter traffic early instead of verifying identity in the `USING` clause.
- **The Subquery Cache Hack:** For performance optimization, avoid raw `auth.uid()` checks on large tables. Force PostgreSQL to cache the execution context by wrapping it in a selective subquery:
  - ❌ Bad: `USING (auth.uid() = user_id)`
  - Good: `USING ((SELECT auth.uid()) = user_id)`

### Code Template Example

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated updates" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING ((SELECT auth.uid()) = id);
```

#### 3. Database & System Guardrails

- **Indexing Requirement:** Whenever an RLS rule targets a foreign key column (e.g., `user_id`, `organization_id`), you must explicitly generate a database index for that column.
- **Service Role Isolation:** Never generate code that passes the `service_role` key to a client application. Restrict its usage advice entirely to edge functions or secure backend environments.
- **Testing Context:** Remind the user that testing queries inside the Supabase Dashboard SQL Editor bypasses RLS. Advise them to test RLS constraints strictly through the Supabase client SDK or via an automated test runner mimicking authenticated client requests.

## Tooling & Workflow

- **Linting/Formatting:** This project strictly uses **Biome**. You must adhere to standard Biome formatting (`biome format` and `biome lint`). Do not suggest or configure ESLint/Prettier.
- **Package Management:** The project utilizes `pnpm`. Check existing dependencies in `package.json` before adding or recommending new packages.

## Interaction Style

- **Think First, Code Second:** When tasked with complex features, plan the architecture and list out the affected files before jumping into writing code.
- **Be Complete:** Provide solid, complete code solutions rather than placeholder comments.
- **Be Proactive:** Anticipate responsive design variants, error states, and loading states for an exceptional user experience.
