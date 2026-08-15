import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";

export type ReleaseCategory = "feature" | "improvement" | "fix" | "security";

export interface ReleaseItem {
  category: ReleaseCategory;
  text: string;
  detail?: string;
}

export interface ReleaseNote {
  version: string;
  date: string; // ISO format 'YYYY-MM-DD'
  title: string;
  summary: string;
  highlights?: string[];
  items: ReleaseItem[];
}

export const RELEASES: ReleaseNote[] = [
  {
    version: "1.0.0",
    date: "2026-08-15",
    title: "Official Release & Core Platform Enhancements",
    summary:
      "Welcome to Prestige Box 1.0.0! This milestone release introduces a unified release management system, robust duplicate person detection, environment indicators, employee association management for companies, and multi-factor passkey authentication.",
    highlights: [
      "New Release Notes & Version tracking system with real-time update indicators",
      "Biometric passkey and WebAuthn multi-factor authentication",
      "Duplicate person detection and smart name standardizer",
      "Dynamic company employee management and association counts",
    ],
    items: [
      {
        category: "feature",
        text: "Interactive Release Notes & Versioning System",
        detail:
          "Added real-time version status in the navigation with 7-day freshness indicators and a dedicated changelog timeline.",
      },
      {
        category: "feature",
        text: "Duplicate Person Detection Engine",
        detail:
          "Automated detection of duplicate contacts and people records during entry and import with collision warnings.",
      },
      {
        category: "feature",
        text: "Company Employee Directory & Relationship Mapping",
        detail: "Link employees directly to company profiles with real-time association count synchronization.",
      },
      {
        category: "security",
        text: "Passkey & Biometric MFA Support",
        detail:
          "Sign in securely using WebAuthn / FIDO2 passkeys, Face ID, and Touch ID from the new Security Settings page.",
      },
      {
        category: "improvement",
        text: "Environment Context Banners",
        detail:
          "Clear visual cues in non-production environments (Localhost, Development, Test) for safer development workflows.",
      },
      {
        category: "improvement",
        text: "Person Name Formatting Standardization",
        detail: "Consistent capitalization, trimming, and title casing across all contact and client profiles.",
      },
      {
        category: "fix",
        text: "Role-Based Access Control and Permission Sync",
        detail: "Resolved edge cases in advisor vs admin permissions across CRM data views and navigation items.",
      },
      {
        category: "fix",
        text: "Controlled Form Input Hydration",
        detail: "Fixed uncontrolled-to-controlled input state transitions across complex CRM forms.",
      },
    ],
  },
  {
    version: "0.9.0",
    date: "2026-08-01",
    title: "CRM Pipelines & Real-Time Collaboration Preview",
    summary:
      "Initial preview of CRM pipeline workflows, Kanban opportunity management, and real-time mention-enabled notes.",
    highlights: [
      "Interactive opportunity pipeline Kanban board",
      "Rich text notes with team @mentions and notifications",
      "Task tracking with workflow automations",
    ],
    items: [
      {
        category: "feature",
        text: "Kanban Board for Opportunities",
        detail: "Drag-and-drop opportunity cards across pipeline stages with automatic value tallying.",
      },
      {
        category: "feature",
        text: "Notes with Mentions & Bell Notifications",
        detail:
          "Mention colleagues with @-tags to instantly notify them through the top navigation notification center.",
      },
      {
        category: "feature",
        text: "Comprehensive Entity Association System",
        detail: "Unified linking across Clients, Households, Companies, Vendors, and Professional Service firms.",
      },
      {
        category: "improvement",
        text: "Theme Customizer & Layout Presets",
        detail: "Customizable light/dark themes, accent presets, font selections, and sidebar layout options.",
      },
      {
        category: "fix",
        text: "Database Schema Migrations & Seeding Tooling",
        detail: "Optimized migration scripts and synthetic data generators for financial advising entities.",
      },
    ],
  },
];

/**
 * Returns all releases sorted by date in descending order (latest first).
 */
export function getReleases(): ReleaseNote[] {
  return [...RELEASES].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Returns the most recent release.
 */
export function getLatestRelease(): ReleaseNote {
  const releases = getReleases();
  return (
    releases[0] || {
      version: "1.0.0",
      date: new Date().toISOString().split("T")[0],
      title: "Prestige Box",
      summary: "Current release",
      items: [],
    }
  );
}

/**
 * Checks whether a given release date is within the specified threshold of days (defaults to 7 days).
 * @param releaseDate - ISO string date 'YYYY-MM-DD'
 * @param daysThreshold - Number of days to consider as "new" (default: 7)
 */
export function isReleaseNew(releaseDate: string, daysThreshold = 7): boolean {
  try {
    const today = startOfDay(new Date());
    const targetDate = startOfDay(parseISO(releaseDate));
    const diffDays = differenceInCalendarDays(today, targetDate);
    return diffDays >= 0 && diffDays <= daysThreshold;
  } catch {
    return false;
  }
}

/**
 * Retrieves a specific release by version number.
 */
export function getReleaseByVersion(version: string): ReleaseNote | undefined {
  const cleanVersion = version.startsWith("v") ? version.slice(1) : version;
  return RELEASES.find((r) => r.version === cleanVersion || r.version === version);
}
