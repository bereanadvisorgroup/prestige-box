import type { Client, Person } from "@/types/crm";

function safelyParseJsonArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
}

function safelyParseJsonObject(val: any): Record<string, any> {
  if (!val) return {};
  if (typeof val === "object" && !Array.isArray(val) && val !== null) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed;
    } catch {
      return {};
    }
  }
  return {};
}

export function normalizePerson(person: any): Person {
  if (!person) return person;
  return {
    ...person,
    emails: safelyParseJsonArray(person.emails),
    phones: safelyParseJsonArray(person.phones),
    socialMedia: safelyParseJsonArray(person.socialMedia),
    addresses: safelyParseJsonArray(person.addresses),
  };
}

export function normalizeClient(client: any): Client {
  if (!client) return client;
  return {
    ...client,
    employments: safelyParseJsonArray(client.employments),
    driversLicense: safelyParseJsonObject(client.driversLicense),
    pii: safelyParseJsonObject(client.pii),
    liabilities: safelyParseJsonArray(client.liabilities),
    mortgages: safelyParseJsonArray(client.mortgages),
  };
}
