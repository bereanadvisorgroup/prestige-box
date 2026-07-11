# Application Features

This document outlines the primary features and modules available within the Prestige Box dashboard.

```mermaid
flowchart LR
    Login[Login Page] --> MFA{MFA Enrolled?}
    MFA -->|Yes| MFAVerify[MFA Verification]
    MFA -->|No| Dashboard{Dashboard / Main}
    MFAVerify --> Dashboard
    Dashboard --> Admin[Admin Panel]
    Dashboard --> CRM[CRM Module]
    Dashboard --> Notes[Notes Dashboard]
    Dashboard --> Tasks[Tasks Dashboard]
    Dashboard --> Pipeline[Pipeline Module]
    Dashboard --> Finance[Finance Module]
    Dashboard --> Reports[Reports Center]
    
    CRM --> ClientProfile[Client Details]
    CRM --> CompanyProfile[Company Details]
    Pipeline --> StageView[Kanban / Stage View]
    Reports --> RelGraph[Relationship Graph]
    Reports --> BenPayment[Benefit Payments]
    Reports --> AudHistory[Audit History Log]
    Reports --> RefRep[Referral Network]
    Admin --> UsersMgmt[Users & Roles]
    Admin --> SystemParams[System Parameters]
```

## Dashboard (`/dashboard`)

The main entry point for authenticated users. It serves as a central hub navigating to all distinct business verticals of Prestige Box.

### 1. Admin Panel (`/dashboard/admin`)
Reserved for system administrators to manage system configurations and entity lists.
- **User Management (`/dashboard/admin/users`)**: Creating, managing, and disabling user accounts, roles (`admin`, `advisor`, `client`), and multi-factor statuses.
- **Service Vendors & Firms**: Full CRUD interfaces to manage linked professional entities:
  - Life Insurance Companies (`/dashboard/admin/life-insurance-companies`)
  - Disability Insurance Companies (`/dashboard/admin/disability-insurance-companies`)
  - Long Term Care Insurance Companies (`/dashboard/admin/long-term-care-insurance`)
  - Money Managers (`/dashboard/admin/money-managers`)
  - Record Keepers (`/dashboard/admin/record-keepers`)
- **System Parameters**: Full CRUD interfaces to configure system-wide dropdown variables:
  - Custodians (`/dashboard/admin/custodians`): Installs custodians like Fidelity, Schwab, etc.
  - Financial Account Types (`/dashboard/admin/financial-account-types`): Defines account schemas (e.g. Traditional IRA, Roth IRA, 401k).
  - Referral Types (`/dashboard/admin/referral-types`): Manages lead sources (e.g. CPA, Attorney, Client, Event).
  - Events (`/dashboard/admin/events`): Manages specific events that serve as lead/referral sources.
- **Workflows (`/dashboard/admin/workflows`)**: Administrative workspace for creating, editing, and managing reusable workflow templates. System administrators can use the template builder interface to specify step names, set relative due date rules, define step responsibility (advisor vs. client), choose priority levels, and upload supporting attachment resources.

### 2. CRM Module (`/dashboard/crm`)
The core relationship management suite.

- **General CRM Dashboards**:
  - **Overview Dashboard (`/dashboard/crm`)**: Summary stats of total profiles, households, clients, and monthly revenue projection, with quick navigation cards.
  - **Notes Dashboard (`/dashboard/crm/notes`)**: Global registry of threaded client/company notes, replies, mentions, and notifications.
  - **Tasks Dashboard (`/dashboard/crm/tasks`)**: Global Kanban board and spreadsheet list for managing all manual and auto-generated workflows.
  - **Workflows (`/dashboard/crm/workflows`)**: A centralized console displaying all active workflow instances across the system. Allows advisors to track overall step progress, check completed steps, start new workflows, and filter active files.
  - **People (`/dashboard/crm/people`)**: Central directory of all individual profiles (clients, prospects, family members, professional contacts) with search, creation, and profile navigation.
  - **Addresses (`/dashboard/crm/addresses`)**: Manages physical address records linked to people, households, companies, and assets.
  - **Households (`/dashboard/crm/households`)**: Groups individuals into family/household units to track aggregate net worth and familial links.
  - **Clients (`/dashboard/crm/clients`)**: Advisor-focused portfolio view of all active clients.
  - **Companies (`/dashboard/crm/companies`)**: Tracks general corporate entities, employers, and client business associations.
  - **Policies (`/dashboard/crm/policies`)**: Central registry for all Life, Disability, and Long-Term Care insurance policies, detailing premiums, effective dates, and payment schedules.

- **Client Profile & Contextual Navigation**: Selecting a client dynamically switches the sidebar to a tailored client-centric navigation menu containing:
  - **Overview & Profile (`/dashboard/crm/clients/[id]/overview`)**: Contact details card, personal info card (demographics, SSN, biological gender, birth date, driver's license), interactive Net Worth timeline graph, and referrals integration:
    - **Referral Source Card (`referred-by-card`)**: View and assign the specific entity that referred the client (supports linking to a Person, Client, Company, custom Referral Type, Event, or Advisor).
    - **Referral Tree Card (`referral-tree-card`)**: Visual diagram showing the network of clients referred by this individual.
  - **Family Tab (`/dashboard/crm/clients/[id]/family`)**: Structure family connections (spouse, parent, child, etc.) and link them directly to system profiles.
  - **Employment (`/dashboard/crm/clients/[id]/employment`)**: Manage employment records, employers, compensation, and active statuses.
  - **Estate Planning (`/dashboard/crm/clients/[id]/estate-planning`)**: Tracks estate planning instruments (Wills, Revocable/Irrevocable Trusts, and other custom documents) in a structured metadata repository. Integrates a searchable autocomplete picker (built on Radix/Base UI Combobox primitives) to link grantors and trustees (either individuals/people or corporate entities/companies) and external legal advisors (law firms). Supports multi-file uploads per repository.
  - **Assets (`/dashboard/crm/clients/[id]/assets`)**: Custom tracking of client assets (Real Estate, Vehicles, Valuables, etc.) including current market value, address linking, and value history snapshots.
  - **Liabilities (`/dashboard/crm/clients/[id]/liabilities`)**: Manage client debts (Auto loans, mortgages, business lines of credit) with banking associations, balances, and statement uploads.
  - **Professional Associations**: Associate/unlink external service providers:
    - Accounting Firms (`/dashboard/crm/clients/[id]/accounting-firms`)
    - Actuarial Firms (`/dashboard/crm/clients/[id]/actuarial-firms`)
    - Banks (`/dashboard/crm/clients/[id]/banks`)
    - Law Firms (`/dashboard/crm/clients/[id]/law-firms`)
    - Property & Casualty (`/dashboard/crm/clients/[id]/property-and-casualty`)
  - **Policies & Managed Accounts**: Track insurance policies and asset management accounts:
    - Life Insurance (`/dashboard/crm/clients/[id]/life-insurance`)
    - Disability Insurance (`/dashboard/crm/clients/[id]/disability-insurance`)
    - Long-Term Care (`/dashboard/crm/clients/[id]/long-term-care`)
    - Money Managers (`/dashboard/crm/clients/[id]/money-managers`): Manage accounts linked to Money Managers, including account numbers, balances, inception dates, custodians, and primary/contingent beneficiaries. Balances automatically project as virtual assets contributing to Net Worth.
    - Record Keepers (`/dashboard/crm/clients/[id]/record-keepers`): Manage record keeper accounts, account numbers, and balances. Balances automatically project as virtual assets contributing to Net Worth.
  - **Internal Workspace (`/dashboard/crm/clients/[id]/internal`)**: Private advisor notes, tasks, workflows, and audit logs:
    - **Internal Notes (`/dashboard/crm/clients/[id]/internal/notes`)**: Collaborative client logs.
    - **Internal Tasks (`/dashboard/crm/clients/[id]/internal/tasks`)**: Tasks associated with this client.
    - **Internal Workflows (`/dashboard/crm/clients/[id]/internal/workflows`)**: View, start, and manage active workflow instances assigned specifically to this client.
    - **Internal History (`/dashboard/crm/clients/[id]/internal/history`)**: Chronological audit trail of changes made to the client's profile.

- **Company Profile & Contextual Navigation**: Selecting a company dynamically switches the sidebar to a tailored company-centric navigation menu containing:
  - **General Overview (`/dashboard/crm/companies/[id]`)**: Details company info, including EIN, website, phone, situs/nexus records, and associated client list.
  - **Valuation History (`/dashboard/crm/companies/[id]/valuation`)**: Tracks historical company values and plots an interactive company valuation timeline.
  - **Payment Accounts & Documents Tab**: Managed tab for company-specific premium payment accounts, and documents folders (Life, Disability, LTC) with file upload capability.
  - **Professional Services**: Link and manage associated service firms specific to that company (Accounting, Actuarial, Banks, Law, Property & Casualty).
  - **Vendors**: Manage company-linked vendors (Life, Disability, LTC insurance companies, Money Managers, Record Keepers).
  - **Internal Workspace (`/dashboard/crm/companies/[id]/internal`)**: Private workspace containing Company Notes (`/notes`), Company Tasks (`/tasks`), Company Workflows (`/workflows` to view, start, and manage active workflow instances assigned to this company), and Audit History logs (`/history`).

### 3. Threaded Notes System (`/dashboard/crm/notes`)
A Reddit-style threaded collaboration space for admins and advisors to share knowledge and discuss client/company matters.
- **Hierarchical Threads**: Supports multi-depth notes (up to 2 levels: note, reply, sub-reply) with denormalized thread retrieval.
- **Rich Context**: Supports Tiptap WYSIWYG editor for body composing, custom emoji picking, files and Google Drive link previews, upvoting/downvoting (aggregating scores), and user mentions (`@username`).
- **Notification Inbox**: Triggers real-time and persistent alerts (mention, reply) in the user's notification bell.

### 4. Task Management System (`/dashboard/crm/tasks`)
A workflows board and spreadsheet view to track advisory deliverables and automate standard client events.
- **Interactive Kanban**: Task Board (`/dashboard/crm/tasks`) organizes tasks into status columns (New, In Process, Waiting Input, Complete) with drag-and-drop triggers.
- **Client & Company Links**: Tasks can be linked to multiple CRM entities for direct contextual lookup.
- **Auto-Generation Engine**: Performs daily idempotent background sync (via `/api/cron/sync-tasks`) to auto-create and renew recurring tasks:
  - **Birthdays**: Tripped by a client profile's date of birth.
  - **Anniversaries**: Tripped by the Spouse's `marriageDate` in the client's family data.
  - **Policy Renewals**: Tripped by an active insurance policy's next renewal date.
- **Assignee Routing**: Auto-tasks route directly to the client's assigned advisor (`advisorId`). Unassigned tasks flag on the global board for team pickup.

### 5. CRM Pipeline (`/dashboard/crm-pipeline`)
A visual management tool for tracking sales, onboarding, or policy lifecycles.
- Tracks prospects through distinct stages of acquisition.
- Smooth transitions from prospect to active client.

### 6. Finance Module (`/dashboard/finance`)
Dedicated space for managing overall corporate numbers and client insurance policies.
- **Policies**: Overall management of Life, Disability, and Long Term Care insurance policies.
- **Premiums & Renewals**: Premium schedules, critical renewal dates, and payment history.
- **Liabilities & Mortgages**: Visualizations of client liabilities.

### 7. Reports Center (`/dashboard/reports`)
Dynamic reporting and analytical views.
- **Benefit Payments (`/dashboard/reports/payments`)**: Tracks expected premium payments, collections, and forecasts.
- **Relationship Graph (`/dashboard/reports/relationship-graph`)**: Interactive SVG representation mapping the connections between a Client, their companies, and associated professional service firms.
- **Referral Network (`/dashboard/reports/referrals`)**: Interactive force-directed network tree visualization built using D3.js. Shows client-to-client referral connections, referral source channel breakdowns (using Recharts Pie charts), and acquisition trends over time.
- **History Report (`/dashboard/reports/history`)**: Global feed of audit history logs tracking mutations (insert/updates/deletions) across CRM entities.

### 8. User Settings & Security (`/dashboard/settings`, `/dashboard/profile`)
Personal configuration pages for the authenticated user.
- **Profile (`/dashboard/profile`)**: Updates for photos, name, and demographic info.
- **Security Settings (`/dashboard/settings`)**: View active authentication factors, enroll in Two-Factor Authentication (TOTP), and register native WebAuthn Passkeys for secure passwordless login.

### 9. Multi-Factor Authentication (MFA) Flows
Strict authentication gates using Supabase MFA.
- **Enrollment (`/auth/mfa-enroll`)**: Screen for generating and enrolling a TOTP factor. Displays a dynamic QR code and manual setup key, demanding a 6-digit confirmation code from the authenticator app to activate the factor.
- **Verification (`/auth/mfa-verify`)**: Mandatory challenge page for users with verified factors who are at the single-factor level (`aal1`), requiring a 6-digit TOTP code to elevate their session to `aal2`.
- **E2E Test Bypass**: Supplying `NEXT_PUBLIC_BYPASS_MFA=true` as an environment variable (e.g. in Playwright config) skips the AAL2 MFA TOTP verification challenge, facilitating automated front-end testing.

### 12. Workflow Automation & Tracking
Prestige Box implements a complete workflow engine that allows firms to formalize, instantiate, and track complex sequences of client or corporate advisory steps.
- **Template Definition**: Admins define master workflows containing a set of ordered steps. Each step specifies:
  - **Responsibility**: Designated to either the `advisor` (internal staff) or `client` (external action).
  - **Relative Deadlines**: Configured via a relative offset (1-7 days) from the start of the workflow or after the completion of the preceding step.
  - **Priority & description**: Priorities range from Low to High, and descriptions support Tiptap WYSIWYG rich text formatting.
  - **Attachments**: Standard reference files uploaded directly to Supabase storage can be pinned to any step.
- **Active Instances**: Templates can be instantiated and assigned to a Client or Company. The system clones the template steps, computes the absolute due dates based on the start date, and registers the active instance.
- **Progress Tracking**: Interactive boards render progress percentage bars calculated dynamically by checking the ratio of completed steps. Staff can view step descriptions, download attachments, and mark steps complete directly in the UI.

### 10. Client Onboarding Setup Flow (`/auth/v1/client-setup`)
Secure client-specific onboarding pathway.
- Custom setup page to welcome new clients and verify identity.
- Enforces strict application password requirements (length, special characters).
- Authenticated logger tracking onboarding flow completions.

### 11. Authentication & Registration Entrypoints
The application provides modern, secure access control via multiple options:
- **Credential Sign-In & Sign-Up**: Secure login (`/login`) and account registration (`/login/create-account`) backed by strict validation and database status checks.
- **Passwordless Device Passkeys**: Users can register and sign in seamlessly using native WebAuthn Passkeys (FaceID, TouchID, or hardware security keys) bypassing passwords entirely.
- **Social OAuth Integration**: Quick authentication using third-party identity providers (Google and Microsoft Azure AD) for unified corporate identity.
