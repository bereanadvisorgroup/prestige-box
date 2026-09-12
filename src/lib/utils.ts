import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (str: string): string => {
  if (typeof str !== "string" || !str.trim()) return "?";

  return (
    str
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
};

export function formatCurrency(
  amount: number,
  opts?: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    noDecimals?: boolean;
  },
) {
  const { currency = "USD", locale = "en-US", minimumFractionDigits, maximumFractionDigits, noDecimals } = opts ?? {};

  const formatOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    minimumFractionDigits: noDecimals ? 0 : minimumFractionDigits,
    maximumFractionDigits: noDecimals ? 0 : maximumFractionDigits,
  };

  return new Intl.NumberFormat(locale, formatOptions).format(amount);
}
export function formatPhoneNumber(phoneNumber: string | undefined | null) {
  if (!phoneNumber) return "";
  const cleaned = phoneNumber.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  // If it doesn't match 10 digits, return cleaned or original
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  return phoneNumber;
}

/**
 * Formats a person's full name with suffix if present: "[firstName or goesBy] [lastName] [suffix]"
 * If goesBy is provided and non-empty, it replaces firstName.
 */
export function formatFullName(
  firstName?: string | null,
  lastName?: string | null,
  suffix?: string | null,
  fallback = "",
  goesBy?: string | null,
): string {
  const first = goesBy?.trim() ? goesBy.trim() : firstName?.trim();
  const parts = [first, lastName?.trim(), suffix?.trim()].filter(Boolean);
  return parts.join(" ") || fallback;
}

/**
 * Formats a person object's full name with suffix: "[firstName or goesBy] [lastName] [suffix]"
 */
export function formatPersonName(
  person?: {
    firstName?: string | null;
    lastName?: string | null;
    suffix?: string | null;
    goesBy?: string | null;
  } | null,
  fallback = "Unknown Person",
): string {
  if (!person) return fallback;
  return formatFullName(person.firstName, person.lastName, person.suffix, fallback, person.goesBy);
}

/**
 * Formats a person's full legal name: "[prefix] [firstName] [middleName] [lastName] [suffix] [\"goesBy\"]"
 * Fields included: Prefix, FirstName, MiddleName, LastName, Suffix, "Goes By" (quoted).
 */
export function formatLegalFullName(
  prefix?: string | null,
  firstName?: string | null,
  middleName?: string | null,
  lastName?: string | null,
  suffix?: string | null,
  goesBy?: string | null,
  fallback = "",
): string {
  const formattedGoesBy = goesBy?.trim() ? `"${goesBy.trim()}"` : undefined;
  const parts = [
    prefix?.trim(),
    firstName?.trim(),
    middleName?.trim(),
    lastName?.trim(),
    suffix?.trim(),
    formattedGoesBy,
  ].filter(Boolean);

  return parts.join(" ") || fallback;
}

/**
 * Formats a person object's full legal name: "[prefix] [firstName] [middleName] [lastName] [suffix] [\"goesBy\"]"
 */
export function formatPersonLegalName(
  person?: {
    prefix?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    suffix?: string | null;
    goesBy?: string | null;
  } | null,
  fallback = "",
): string {
  if (!person) return fallback;
  return formatLegalFullName(
    person.prefix,
    person.firstName,
    person.middleName,
    person.lastName,
    person.suffix,
    person.goesBy,
    fallback,
  );
}
