# Prestige Box

Customer Relationship Management (CRM) for prestigious Financial Advisors.

Prestige Box is a comprehensive, modern web application designed to manage complex client relationships, financial tracking, sales pipelines, and specialized policies (Life, Disability, Long Term Care) for high-end financial advisory firms.

## Tech Stack & Features

- **Framework**: Next.js 16 (App Router) & React 19
- **Backend & Auth**: Supabase (PostgreSQL)
- **Strict MFA & Passkeys**: Multi-Factor Authentication (TOTP) and WebAuthn Passkeys integrated via Supabase Auth, strictly enforced at the Next.js Proxy layer and PostgreSQL Row Level Security (RLS) policies for financial data (with test bypass capabilities).
- **Household Profile & Navigation**: Dynamic contextual navigation suite for family/household management (`/dashboard/crm/households/[id]`), interactive visual family tree hierarchy, multi-member asset/liability rollups, estate planning, and policy views.
- **Financial & Portfolio Rollup Engines**: Derives net worth growth curves, liquid assets, debt ratios, and asset allocation distributions across physical assets and virtual managed account projections (`portfolio-rollup.ts`).
- **Workflows & Templates**: Reusable template definitions with custom steps, responsibilities (advisor vs. client), deadlines, priority, and attachments, which can be instantiated and tracked for specific client or company portfolios.
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand (Client) & TanStack React Query (Server)
- **UI Components**: Shadcn UI, Base UI, Radix UI, Lucide React
- **Data Visualizations**: Recharts, D3.js (for interactive referral network simulations)
- **Logging & Telemetry**: Axiom via `next-axiom`

## Documentation

Comprehensive documentation covering the architecture, database schema, application features, and UI standards can be found in the `docs/` directory:

- 🏗️ **[Architecture](docs/architecture.md)**: System design, Next.js routing, and Supabase integration.
- 🗄️ **[Database](docs/database.md)**: Drizzle ORM schema, entities, and Row Level Security (RLS).
- ⚙️ **[Features](docs/features.md)**: Core dashboard modules (Admin, CRM, Pipeline, Finance, Reports).
- 🎨 **[UI Components](docs/ui-components.md)**: Design system, styling rules, and Data Table standards.

## Quickstart

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env.local` and fill in your Supabase connection details:

   ```bash
   cp .env.example .env.local
   ```

3. **Database Setup**
   Push the Drizzle schema to your Supabase database and run the seeder to generate realistic dummy data:

   ```bash
   pnpm drizzle-kit push
   pnpm run db:seed
   ```

4. **Run the Development Server**

   ```bash
   pnpm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.
