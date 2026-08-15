# Changelog

All notable changes to Prestige Box are documented in this file and rendered interactively in the application at `/dashboard/release-notes`.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
