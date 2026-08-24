# Changelog

All notable changes to Prestige Box are documented in this file and rendered interactively in the application at `/dashboard/release-notes`.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-08-23

### Added
- **Outcome-Based Workflow Triggers**: Trigger and instantiate follow-up workflows automatically based on the selected outcome of a workflow step.
- **Configurable Task Categories**: Administrator capability to configure, create, and manage available Task categories directly in system settings.
- **Person "Goes By" (Preferred Name) Field**: Added "Goes By" field across individual profiles, with database-wide fallback logic displaying the preferred name before falling back to the first name across all views and tables.
- **Household Address Quick-Actions**: Quick-action button(s) on the household edit form to associate and link the address from the Head of Household or Spouse when the household lacks an address.
- **Household Internal Quick Edit**: Direct Edit action button in the upper right corner of the Household Internal landing page.

### Changed
- **Household Edit Form Persistence**: Saving updates on the household edit form now keeps the user on the form instead of redirecting back to the households list.
- **In-App Note Tag Notifications**: Replaced external email notifications with real-time in-app system notifications whenever a user is @tagged in a note.

---

## [1.0.0] - 2026-08-15

### Added
- **Interactive Release Notes & Versioning System**: Dynamic version display in navigation footer with 7-day freshness indicators and full changelog page (`/dashboard/release-notes`).
- **Duplicate Person Detection Engine**: Real-time detection of potential duplicate people during manual entry and bulk import.
- **Company Employee Directory**: Association management linking employees to company profiles with live count badge updates.
- **Passkey & Biometric MFA**: WebAuthn and FIDO2 authentication supporting Face ID, Touch ID, and security keys.

### Changed
- **Environment Context Banners**: Persistent environment badges for Localhost, Dev, and Test instances.
- **Standardized Person Names**: Auto-formatting and casing for person first, middle, and last names.

### Fixed
- **Role-Based Access Control**: Corrected permission isolation between Advisor and Admin navigation groups.
- **Controlled Input State**: Fixed hydration and state consistency across complex CRM form components.

---

## [0.9.0] - 2026-08-01

### Added
- **Kanban Board for Opportunities**: Visual pipeline stages with drag-and-drop opportunity cards.
- **Team Notes & @Mentions**: Rich text note-taking with team mentions and bell notification dispatch.
- **Comprehensive Entity Association**: Linking system across Clients, Households, Companies, Vendors, and Law/Accounting Firms.

### Changed
- **Theme & Layout Presets**: Added dark/light mode toggle, accent colors, and sidebar collapse modes.

### Fixed
- **Database Migrations & Seed Tooling**: Streamlined Postgres migration and synthetic database seed scripts.
