/**
 * United States 2-Letter State Acronyms, Full Names, and Normalization Utilities.
 */

export interface UsState {
  code: string;
  name: string;
}

/**
 * The 50 United States plus District of Columbia,
 * sorted alphabetically by their official 2-letter acronym.
 */
export const US_STATES: readonly UsState[] = [
  { code: "AK", name: "Alaska" },
  { code: "AL", name: "Alabama" },
  { code: "AR", name: "Arkansas" },
  { code: "AZ", name: "Arizona" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DC", name: "District of Columbia" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "IA", name: "Iowa" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "MA", name: "Massachusetts" },
  { code: "MD", name: "Maryland" },
  { code: "ME", name: "Maine" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MO", name: "Missouri" },
  { code: "MS", name: "Mississippi" },
  { code: "MT", name: "Montana" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "NE", name: "Nebraska" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NV", name: "Nevada" },
  { code: "NY", name: "New York" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VA", name: "Virginia" },
  { code: "VT", name: "Vermont" },
  { code: "WA", name: "Washington" },
  { code: "WI", name: "Wisconsin" },
  { code: "WV", name: "West Virginia" },
  { code: "WY", name: "Wyoming" },
] as const;

export const US_STATE_CODES = US_STATES.map((s) => s.code);

// Lookup map from lowercase normalized name/alias to 2-letter abbreviation
const STATE_NAME_TO_CODE_MAP = new Map<string, string>();
// Lookup map from uppercase 2-letter code to full state name
const CODE_TO_STATE_NAME_MAP = new Map<string, string>();

for (const { code, name } of US_STATES) {
  CODE_TO_STATE_NAME_MAP.set(code, name);
  STATE_NAME_TO_CODE_MAP.set(name.toLowerCase(), code);
  STATE_NAME_TO_CODE_MAP.set(code.toLowerCase(), code);
}

// US Territories support in translation lookup
const TERRITORIES: readonly UsState[] = [
  { code: "AS", name: "American Samoa" },
  { code: "GU", name: "Guam" },
  { code: "MP", name: "Northern Mariana Islands" },
  { code: "PR", name: "Puerto Rico" },
  { code: "VI", name: "U.S. Virgin Islands" },
];

for (const { code, name } of TERRITORIES) {
  CODE_TO_STATE_NAME_MAP.set(code, name);
  STATE_NAME_TO_CODE_MAP.set(name.toLowerCase(), code);
  STATE_NAME_TO_CODE_MAP.set(code.toLowerCase(), code);
}

// Common aliases, punctuation variations, and historical abbreviations
const STATE_ALIASES: Record<string, string> = {
  "washington dc": "DC",
  "washington, dc": "DC",
  "washington d.c.": "DC",
  "washington, d.c.": "DC",
  "d.c.": "DC",
  dc: "DC",
  "dist of columbia": "DC",
  "district of columbia": "DC",
  "us virgin islands": "VI",
  "u.s. virgin islands": "VI",
  "virgin islands": "VI",
  "ala.": "AL",
  "al.": "AL",
  "alas.": "AK",
  "ak.": "AK",
  "ariz.": "AZ",
  "az.": "AZ",
  "ark.": "AR",
  "ar.": "AR",
  "calif.": "CA",
  calif: "CA",
  "ca.": "CA",
  "colo.": "CO",
  "co.": "CO",
  "conn.": "CT",
  "ct.": "CT",
  "del.": "DE",
  "de.": "DE",
  "fla.": "FL",
  "fl.": "FL",
  "ga.": "GA",
  "hi.": "HI",
  "id.": "ID",
  "ill.": "IL",
  "il.": "IL",
  "ind.": "IN",
  "in.": "IN",
  "ia.": "IA",
  "kans.": "KS",
  "kan.": "KS",
  "ks.": "KS",
  "ky.": "KY",
  "la.": "LA",
  "me.": "ME",
  "md.": "MD",
  "mass.": "MA",
  "ma.": "MA",
  "mich.": "MI",
  "mi.": "MI",
  "minn.": "MN",
  "mn.": "MN",
  "miss.": "MS",
  "ms.": "MS",
  "mo.": "MO",
  "mont.": "MT",
  "mt.": "MT",
  "nebr.": "NE",
  "neb.": "NE",
  "ne.": "NE",
  "nev.": "NV",
  "nv.": "NV",
  "n.h.": "NH",
  "nh.": "NH",
  "n.j.": "NJ",
  "nj.": "NJ",
  "n.m.": "NM",
  "nm.": "NM",
  "n.y.": "NY",
  "ny.": "NY",
  "n.c.": "NC",
  "nc.": "NC",
  "n.d.": "ND",
  "nd.": "ND",
  "oh.": "OH",
  "okla.": "OK",
  "ok.": "OK",
  "oreg.": "OR",
  "ore.": "OR",
  "or.": "OR",
  "pa.": "PA",
  "penn.": "PA",
  "penna.": "PA",
  "r.i.": "RI",
  "ri.": "RI",
  "s.c.": "SC",
  "sc.": "SC",
  "s.d.": "SD",
  "sd.": "SD",
  "tenn.": "TN",
  "tn.": "TN",
  "tex.": "TX",
  "tx.": "TX",
  "ut.": "UT",
  "vt.": "VT",
  "va.": "VA",
  "wash.": "WA",
  "wa.": "WA",
  "w.va.": "WV",
  "w.v.": "WV",
  "wv.": "WV",
  "wis.": "WI",
  "wisc.": "WI",
  "wi.": "WI",
  "wyo.": "WY",
  "wy.": "WY",
  "p.r.": "PR",
  "pr.": "PR",
};

for (const [alias, code] of Object.entries(STATE_ALIASES)) {
  STATE_NAME_TO_CODE_MAP.set(alias.toLowerCase(), code);
}

/**
 * Translates any US state name, common alias, or abbreviation to the standard 2-letter uppercase acronym.
 * If the value cannot be matched to a known US state, returns the trimmed value (preserving custom data).
 *
 * @example
 * normalizeStateToAbbreviation("North Carolina") // "NC"
 * normalizeStateToAbbreviation("north carolina") // "NC"
 * normalizeStateToAbbreviation("N.C.") // "NC"
 * normalizeStateToAbbreviation("nc") // "NC"
 * normalizeStateToAbbreviation("CA") // "CA"
 * normalizeStateToAbbreviation("Washington, D.C.") // "DC"
 */
export function normalizeStateToAbbreviation(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct check for 2-letter uppercase codes
  const upper = trimmed.toUpperCase();
  if (CODE_TO_STATE_NAME_MAP.has(upper)) {
    return upper;
  }

  // Normalize search string: lowercase, remove periods, collapse whitespace
  const normalizedKey = trimmed.toLowerCase().replace(/\./g, "").replace(/,/g, " ").replace(/\s+/g, " ").trim();

  // Try direct normalized lookup
  const matchedCode = STATE_NAME_TO_CODE_MAP.get(normalizedKey);
  if (matchedCode) {
    return matchedCode;
  }

  // Check if stripping all non-alphanumeric matches
  const alphanumericKey = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  const matchedAlphaCode = STATE_NAME_TO_CODE_MAP.get(alphanumericKey);
  if (matchedAlphaCode) {
    return matchedAlphaCode;
  }

  // If already 2 characters, uppercase it
  if (trimmed.length === 2 && /^[a-zA-Z]{2}$/.test(trimmed)) {
    return upper;
  }

  // Fallback: return original trimmed string to avoid losing unmapped values
  return trimmed;
}

/**
 * Returns the full name of a US state from its 2-letter acronym, or null if unknown.
 *
 * @example
 * getStateName("NC") // "North Carolina"
 */
export function getStateName(code: string | null | undefined): string | null {
  if (!code) return null;
  return CODE_TO_STATE_NAME_MAP.get(code.trim().toUpperCase()) ?? null;
}
