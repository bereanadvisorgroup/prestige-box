import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import postgres from "postgres";

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let dbUrl = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const activeLines = envContent
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => l && !l.startsWith("#"));
  const match = activeLines.find((l: string) => l.startsWith("SUPABASE_DIRECT_URL="));
  if (match) {
    dbUrl = match.split("=").slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}

if (!dbUrl) {
  dbUrl = process.env.SUPABASE_DIRECT_URL || "";
}

if (!dbUrl) {
  console.error("ERROR: SUPABASE_DIRECT_URL is not defined in .env.local or environment.");
  process.exit(1);
}

// Enable connection resilience and pool options suitable for high-volume ingest
const sql = postgres(dbUrl, {
  max: 10,
  idle_timeout: 30,
  max_lifetime: 60 * 5,
  connect_timeout: 30,
});

// Helper to extract shortened title from body content
function getShortenedTitle(content: string | null | undefined): string {
  if (!content) return "Imported Note";
  const cleanStr = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (!cleanStr) return "Imported Note";

  const firstSentence = cleanStr.split(/(?<=[.?!])\s+/)[0] || cleanStr;
  if (firstSentence.length <= 60) {
    return firstSentence;
  }
  const trimmed = firstSentence.substring(0, 60);
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace > 20) {
    return `${trimmed.substring(0, lastSpace)}...`;
  }
  return `${trimmed}...`;
}

// Helper for parsing household names like "Rodriguez, Aramis & Glenda"
function parseHouseholdName(name: string): { lastName: string; firstNames: string[] } {
  if (!name.includes(",")) {
    return { lastName: name.trim(), firstNames: [] };
  }
  const parts = name.split(",");
  const lastName = parts[0].trim();
  const rest = parts.slice(1).join(",").trim();
  const firstNames = rest
    .split(/&|\band\b|,/i)
    .map((s) => s.trim())
    .filter(Boolean);

  return { lastName, firstNames };
}

// Helper to parse contact tags from comma-separated string or string array
function getContactTags(c: any): string[] {
  if (!c || !c.tags) return [];
  if (Array.isArray(c.tags)) {
    return c.tags.map((t: any) => String(t).trim()).filter(Boolean);
  }
  if (typeof c.tags === "string") {
    return c.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
  }
  return [];
}

// Helper to check if contact has a specific tag (case-insensitive)
function hasTag(c: any, targetTag: string): boolean {
  const tags = getContactTags(c);
  const targetLower = targetTag.trim().toLowerCase();
  return tags.some((t) => t.toLowerCase() === targetLower);
}

// Dictionary mapping common nicknames to formal given names
const NICKNAME_MAP: Record<string, string> = {
  al: "Albert",
  alec: "Alexander",
  alex: "Alexander",
  andy: "Andrew",
  art: "Arthur",
  arty: "Arthur",
  barry: "Bartholomew",
  becky: "Rebecca",
  ben: "Benjamin",
  benny: "Benjamin",
  bernie: "Bernard",
  beth: "Elizabeth",
  betsy: "Elizabeth",
  betty: "Elizabeth",
  bill: "William",
  billy: "William",
  bob: "Robert",
  bobby: "Robert",
  brad: "Bradley",
  cathy: "Catherine",
  charles: "Charles",
  charlie: "Charles",
  chas: "Charles",
  chris: "Christopher",
  chuck: "Charles",
  cliff: "Clifford",
  curt: "Curtis",
  dan: "Daniel",
  danny: "Daniel",
  dave: "David",
  davey: "David",
  deb: "Deborah",
  debbie: "Deborah",
  dex: "Dexter",
  dick: "Richard",
  don: "Donald",
  donnie: "Donald",
  doug: "Douglas",
  drew: "Andrew",
  ed: "Edward",
  eddie: "Edward",
  eli: "Elijah",
  frank: "Francis",
  frankie: "Francis",
  fred: "Frederick",
  freddy: "Frederick",
  gabe: "Gabriel",
  gene: "Eugene",
  geoff: "Geoffrey",
  glen: "Glenn",
  greg: "Gregory",
  hank: "Henry",
  harry: "Harold",
  howie: "Howard",
  irv: "Irving",
  jack: "John",
  jake: "Jacob",
  james: "James",
  jeff: "Jeffrey",
  jen: "Jennifer",
  jenny: "Jennifer",
  jerry: "Gerald",
  jim: "James",
  jimmy: "James",
  joe: "Joseph",
  joey: "Joseph",
  john: "John",
  johnny: "John",
  jon: "John",
  josh: "Joshua",
  kate: "Katherine",
  kathy: "Katherine",
  katie: "Katherine",
  ken: "Kenneth",
  kenny: "Kenneth",
  larry: "Lawrence",
  lenny: "Leonard",
  leo: "Leonard",
  liam: "William",
  lisa: "Elizabeth",
  liz: "Elizabeth",
  lizzie: "Elizabeth",
  maggie: "Margaret",
  marty: "Martin",
  matt: "Matthew",
  meg: "Margaret",
  mickey: "Michael",
  mike: "Michael",
  mitch: "Mitchell",
  nate: "Nathaniel",
  nathan: "Nathaniel",
  nick: "Nicholas",
  pat: "Patrick",
  patty: "Patricia",
  peggy: "Margaret",
  pete: "Peter",
  phil: "Philip",
  ray: "Raymond",
  rich: "Richard",
  richie: "Richard",
  rick: "Richard",
  ricky: "Richard",
  rob: "Robert",
  robbie: "Robert",
  rod: "Rodney",
  ron: "Ronald",
  ronnie: "Ronald",
  russ: "Russell",
  sam: "Samuel",
  sammy: "Samuel",
  sid: "Sidney",
  stan: "Stanley",
  steve: "Stephen",
  steven: "Stephen",
  stu: "Stewart",
  sue: "Susan",
  susie: "Susan",
  ted: "Theodore",
  teddy: "Theodore",
  terry: "Terrence",
  theo: "Theodore",
  tim: "Timothy",
  timmy: "Timothy",
  tom: "Thomas",
  tommy: "Thomas",
  tony: "Anthony",
  tricia: "Patricia",
  vicky: "Victoria",
  vince: "Vincent",
  vinny: "Vincent",
  wally: "Walter",
  walt: "Walter",
  will: "William",
  willy: "William",
  zach: "Zachary",
  zack: "Zachary",
};

// Helper to get formal/canonical given name
function getCanonicalFirstName(rawFirstName: string): {
  canonical: string;
  wasConverted: boolean;
  original: string;
} {
  const original = (rawFirstName || "").trim();
  if (!original) {
    return { canonical: "Unknown", wasConverted: false, original: "" };
  }
  const lower = original.toLowerCase();
  if (NICKNAME_MAP[lower]) {
    const canonical = NICKNAME_MAP[lower];
    return {
      canonical,
      wasConverted: canonical.toLowerCase() !== lower,
      original,
    };
  }
  const titleCased = original.charAt(0).toUpperCase() + original.slice(1);
  return {
    canonical: titleCased,
    wasConverted: false,
    original,
  };
}

// Helper to normalize an address object and generate a canonical deduplication key
function normalizeAddress(addr: any): {
  key: string;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
} | null {
  if (!addr) return null;
  const street1 = (addr.street_line_1 || addr.street1 || "").trim();
  const street2 = (addr.street_line_2 || addr.street2 || "").trim() || null;
  const city = (addr.city || "").trim();
  const state = (addr.state || "").trim().toUpperCase();
  const rawZip = (addr.zip_code || addr.zipCode || "").trim();
  const zipCode = rawZip.split("-")[0].trim();
  const country = (addr.country || "").trim() || "USA";

  if (!street1 && !city && !state && !zipCode) return null;

  const key = `${street1.toLowerCase()}|${(street2 || "").toLowerCase()}|${city.toLowerCase()}|${state}|${zipCode}`;
  return {
    key,
    street1: street1 || "N/A",
    street2,
    city: city || "N/A",
    state: state || "N/A",
    zipCode: zipCode || "N/A",
    country,
  };
}

// Helper to normalize person suffix (Jr, Sr, II, III, IV, etc.)
function normalizeSuffix(suffix: string | null | undefined): string {
  if (!suffix) return "";
  let clean = suffix.trim().replace(/[.,;]+$/, "").trim().toUpperCase();
  if (clean === "JUNIOR") clean = "JR";
  if (clean === "SENIOR") clean = "SR";
  if (clean === "2ND") clean = "II";
  if (clean === "3RD") clean = "III";
  if (clean === "4TH") clean = "IV";
  if (clean === "5TH") clean = "V";
  return clean;
}

// Helper to export an array of contact objects to RFC 4180 compliant CSV
function exportContactsToCsv(contacts: any[], outputPath: string) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (contacts.length === 0) {
    fs.writeFileSync(outputPath, "", "utf8");
    return;
  }

  const keySet = new Set<string>();
  for (const c of contacts) {
    for (const key of Object.keys(c)) {
      keySet.add(key);
    }
  }
  const headers = Array.from(keySet);

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    let str: string;
    if (typeof val === "object") {
      str = JSON.stringify(val);
    } else {
      str = String(val);
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  const lines: string[] = [];
  lines.push(headers.map(escapeCsv).join(","));

  for (const c of contacts) {
    const row = headers.map((h) => escapeCsv(c[h]));
    lines.push(row.join(","));
  }

  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
}

// Generic helper to flush array of rows in batches
async function flushBatch<T>(
  batch: T[],
  batchSize: number,
  insertFn: (chunk: T[]) => Promise<void>
) {
  for (let i = 0; i < batch.length; i += batchSize) {
    const chunk = batch.slice(i, i + batchSize);
    await insertFn(chunk);
  }
}

async function runMigration() {
  const startTime = Date.now();

  let jsonPathArg = process.argv[2] ? process.argv[2].replace(/^['"]|['"]$/g, "") : "";

  if (!jsonPathArg) {
    const candidatePaths = [
      "migrate/20260801_ClientList.json",
      "migration/20260801_ClientList.json",
      "scripts/20260801_ClientList.json",
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(path.resolve(process.cwd(), p))) {
        jsonPathArg = p;
        break;
      }
    }
    if (!jsonPathArg) {
      jsonPathArg = "migrate/20260801_ClientList.json";
    }
  }

  const jsonPath = path.resolve(process.cwd(), jsonPathArg);

  if (!fs.existsSync(jsonPath)) {
    console.error(`ERROR: JSON file not found at ${jsonPath}`);
    process.exit(1);
  }

  console.log(`Starting migration using data file: ${jsonPath}`);
  console.log(`Connected to database host: ${dbUrl!.split("@")[1] || "PostgreSQL"}`);

  // 1. Pre-Migration Table Reset
  console.log("\n--- STEP 1: Truncating existing tables ---");
  await sql`
    TRUNCATE TABLE note_associations, notes, company_employees, company_owners, households, companies, clients, people, addresses CASCADE;
  `;
  console.log("Existing tables successfully truncated.");

  // 2. Read and Parse JSON Data
  console.log("\n--- STEP 2: Loading JSON file into memory ---");
  const rawData = fs.readFileSync(jsonPath, "utf8");
  const data = JSON.parse(rawData);

  const contacts = data.contacts || [];
  const notes = data.notes || [];
  const comments = data.comments || [];

  console.log(`JSON parsed successfully: ${contacts.length} contacts, ${notes.length} notes, ${comments.length} comments.`);

  // Result trackers
  const contactResultsMap = new Map<number, {
    originalId: number;
    name: string;
    type: string;
    tags: string[];
    status: "successful" | "ignored";
    reason: string;
    clientId: string | null;
    companyId: string | null;
    householdId: string | null;
    personId?: string | null;
    entityType: string | null;
    notesNotImported: {
      id?: number;
      title: string;
      contentSnippet: string;
      reason: string;
    }[];
  }>();

  const fdcMailingContacts: any[] = [];
  const adcpaContacts: any[] = [];
  const contactsToImport: any[] = [];

  for (const c of contacts) {
    const tags = getContactTags(c);
    const hasFdc = hasTag(c, "FDC Mailing List");
    const hasAdcpa = hasTag(c, "ADCPA");
    const contactName = (c.name || `${c.first_name || ""} ${c.last_name || ""}`).trim() || "Unknown";

    if (hasFdc) {
      fdcMailingContacts.push(c);
    }
    if (hasAdcpa) {
      adcpaContacts.push(c);
    }

    if (hasFdc || hasAdcpa) {
      const reasons: string[] = [];
      if (hasFdc) reasons.push("Has tag 'FDC Mailing List'");
      if (hasAdcpa) reasons.push("Has tag 'ADCPA'");

      contactResultsMap.set(c.id, {
        originalId: c.id,
        name: contactName,
        type: c.type || "Unknown",
        tags,
        status: "ignored",
        reason: `Ignored: ${reasons.join(", ")}`,
        clientId: null,
        companyId: null,
        householdId: null,
        personId: null,
        entityType: null,
        notesNotImported: [],
      });
    } else {
      contactsToImport.push(c);
      contactResultsMap.set(c.id, {
        originalId: c.id,
        name: contactName,
        type: c.type || "Unknown",
        tags,
        status: "successful",
        reason: "Imported into database",
        clientId: null,
        companyId: null,
        householdId: null,
        personId: null,
        entityType: null,
        notesNotImported: [],
      });
    }
  }

  console.log(`\nTag filtering complete: ${contactsToImport.length} contacts to import, ${fdcMailingContacts.length} FDC Mailing List contacts, ${adcpaContacts.length} ADCPA contacts.`);

  // Export CSV files to /migration/ directory
  const fdcCsvPath = path.resolve(process.cwd(), "migration/FDC_MailingList.csv");
  const adcpaCsvPath = path.resolve(process.cwd(), "migration/ADCPA.csv");

  exportContactsToCsv(fdcMailingContacts, fdcCsvPath);
  console.log(`Exported ${fdcMailingContacts.length} contacts to ${fdcCsvPath}`);

  exportContactsToCsv(adcpaContacts, adcpaCsvPath);
  console.log(`Exported ${adcpaContacts.length} contacts to ${adcpaCsvPath}`);

  // In-memory maps (Legacy ID -> New UUID)
  const personIdMap = new Map<number, string>();
  const clientIdMap = new Map<number, string>();
  const companyIdMap = new Map<number, string>();
  const householdIdMap = new Map<number, string>();

  const allPeople: Array<{ legacyId: number; personId: string; clientId: string; firstName: string; lastName: string }> = [];

  const personContacts = contactsToImport.filter((c: any) => c.type === "Person");
  const companyContacts = contactsToImport.filter((c: any) => c.type === "Organization");
  const householdContacts = contactsToImport.filter((c: any) => c.type === "Household");

  console.log(`\nFound ${personContacts.length} Person contacts, ${companyContacts.length} Organization contacts, ${householdContacts.length} Household contacts to import.`);

  // Prepare batch buffers
  const addressesRows: any[] = [];
  const peopleRows: any[] = [];
  const clientsRows: any[] = [];
  const companiesRows: any[] = [];
  const householdsRows: any[] = [];
  const tagNotesRows: any[] = [];
  const tagAssocRows: any[] = [];
  const companyOwnersRows: any[] = [];
  const companyEmployeesRows: any[] = [];
  const notesRows: any[] = [];
  const noteAssocRows: any[] = [];

  const skippedItems: Array<{ type: string; legacyId: number; contentSnippet: string; reason: string }> = [];

  // Global address deduplication registry
  const globalAddressMap = new Map<
    string,
    {
      id: string;
      street1: string;
      street2: string | null;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      entityCount: number;
    }
  >();

  let totalAddressOccurrences = 0;

  function getOrCreateAddress(addrInput: any): {
    id: string;
    street1: string;
    street2: string | null;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isNew: boolean;
  } | null {
    const norm = normalizeAddress(addrInput);
    if (!norm) return null;

    totalAddressOccurrences++;

    if (globalAddressMap.has(norm.key)) {
      const existing = globalAddressMap.get(norm.key)!;
      existing.entityCount++;
      return { ...existing, isNew: false };
    }

    const addrUuid = crypto.randomUUID();
    const entry = {
      id: addrUuid,
      street1: norm.street1,
      street2: norm.street2,
      city: norm.city,
      state: norm.state,
      zipCode: norm.zipCode,
      country: norm.country,
      entityCount: 1,
    };

    globalAddressMap.set(norm.key, entry);

    addressesRows.push({
      id: addrUuid,
      street1: norm.street1,
      street2: norm.street2,
      city: norm.city,
      state: norm.state,
      zipCode: norm.zipCode,
      country: norm.country,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { ...entry, isNew: true };
  }

  // --- STEP 3: Deduplicate Person Contacts & Normalize Nicknames ---
  console.log("\n--- STEP 3: Deduplicating Person Contacts & Normalizing Names ---");

  const personGroups = new Map<string, any[]>();
  const nicknameConversions: Array<{
    legacyId: number;
    originalName: string;
    canonicalName: string;
    mergedIntoLegacyId: number | null;
    reason: string;
  }> = [];

  for (const c of personContacts) {
    const rawFirstName = (c.first_name || "").trim() || (c.name || "").trim() || "Unknown";
    const lastName = (c.last_name || "").trim() || "Unknown";
    const rawSuffix = (c.suffix || "").trim();
    const normalizedSuffix = normalizeSuffix(rawSuffix);
    const { canonical, wasConverted, original } = getCanonicalFirstName(rawFirstName);
    const key = `${canonical.toLowerCase()}|${lastName.toLowerCase()}|${normalizedSuffix.toLowerCase()}`;

    if (!personGroups.has(key)) {
      personGroups.set(key, []);
    }
    personGroups.get(key)!.push({
      ...c,
      _canonicalFirstName: canonical,
      _wasConverted: wasConverted,
      _originalFirstName: original,
      _lastName: lastName,
      _normalizedSuffix: normalizedSuffix,
    });
  }

  let totalDuplicatesDetected = 0;
  let duplicatesMerged = 0;

  for (const [groupKey, groupMembers] of personGroups.entries()) {
    // Sort to determine primary record
    groupMembers.sort((a, b) => {
      // 1. Prefer record whose original first name is already formal/canonical
      const aIsFormal = a._originalFirstName.toLowerCase() === a._canonicalFirstName.toLowerCase() ? 1 : 0;
      const bIsFormal = b._originalFirstName.toLowerCase() === b._canonicalFirstName.toLowerCase() ? 1 : 0;
      if (aIsFormal !== bIsFormal) return bIsFormal - aIsFormal;

      // 2. Prefer record with more contact information
      const aScore = (a.emails?.length || 0) + (a.phones?.length || 0) + (a.addresses?.length || 0);
      const bScore = (b.emails?.length || 0) + (b.phones?.length || 0) + (b.addresses?.length || 0);
      if (aScore !== bScore) return bScore - aScore;

      // 3. Prefer earlier creation date
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return aDate - bDate;
    });

    const primaryContact = groupMembers[0];
    const secondaryContacts = groupMembers.slice(1);

    if (secondaryContacts.length > 0) {
      totalDuplicatesDetected += groupMembers.length;
      duplicatesMerged += secondaryContacts.length;
    }

    const personUuid = crypto.randomUUID();
    const clientUuid = crypto.randomUUID();

    // Map ALL legacy IDs in this group to the same UUIDs (so notes and households link correctly)
    for (const member of groupMembers) {
      personIdMap.set(member.id, personUuid);
      clientIdMap.set(member.id, clientUuid);
    }

    const firstName = primaryContact._canonicalFirstName;
    const lastName = primaryContact._lastName;
    const suffix = primaryContact.suffix ? primaryContact.suffix.trim() : null;
    const fullName = [firstName, lastName, suffix].filter(Boolean).join(" ");

    allPeople.push({
      legacyId: primaryContact.id,
      personId: personUuid,
      clientId: clientUuid,
      firstName,
      lastName,
    });

    if (primaryContact._wasConverted) {
      const origFullName = [primaryContact._originalFirstName, lastName, suffix].filter(Boolean).join(" ");
      nicknameConversions.push({
        legacyId: primaryContact.id,
        originalName: origFullName,
        canonicalName: fullName,
        mergedIntoLegacyId: null,
        reason: `Standardized nickname '${primaryContact._originalFirstName}' to given name '${firstName}'`,
      });
    }

    // Update primary contact result tracking
    const primaryResult = contactResultsMap.get(primaryContact.id);
    if (primaryResult) {
      primaryResult.clientId = clientUuid;
      primaryResult.personId = personUuid;
      primaryResult.entityType = "client";
      primaryResult.name = fullName;
      if (secondaryContacts.length > 0) {
        primaryResult.reason = `Imported into database (merged ${secondaryContacts.length} duplicate record(s): IDs ${secondaryContacts.map((s) => s.id).join(", ")})`;
      }
    }

    // Process each secondary/duplicate contact
    for (const sec of secondaryContacts) {
      const secResult = contactResultsMap.get(sec.id);
      const secSuffix = sec.suffix ? sec.suffix.trim() : null;
      const secOrigFullName = [sec._originalFirstName, sec._lastName, secSuffix].filter(Boolean).join(" ");

      if (secResult) {
        secResult.status = "deduplicated" as any;
        secResult.clientId = clientUuid;
        secResult.personId = personUuid;
        secResult.entityType = "client";
        secResult.reason = `Merged into primary contact ${fullName} (ID: ${primaryContact.id}) due to duplicate / nickname match`;
      }

      nicknameConversions.push({
        legacyId: sec.id,
        originalName: secOrigFullName,
        canonicalName: fullName,
        mergedIntoLegacyId: primaryContact.id,
        reason: `Merged duplicate record '${secOrigFullName}' (ID: ${sec.id}) into '${fullName}' (ID: ${primaryContact.id})`,
      });
    }

    // Merge unique addresses across all records in the group
    const addressIds: string[] = [];
    const peopleAddressesFormatted: any[] = [];
    const seenAddressIdsForPerson = new Set<string>();

    for (const member of groupMembers) {
      if (Array.isArray(member.addresses)) {
        for (const addr of member.addresses) {
          const resolved = getOrCreateAddress(addr);
          if (!resolved || seenAddressIdsForPerson.has(resolved.id)) continue;

          seenAddressIdsForPerson.add(resolved.id);
          addressIds.push(resolved.id);
          peopleAddressesFormatted.push({
            id: resolved.id,
            street1: resolved.street1,
            street2: resolved.street2,
            city: resolved.city,
            state: resolved.state,
            zipCode: resolved.zipCode,
            country: resolved.country,
            kind: addr.kind || "Main",
          });
        }
      }
    }

    // Merge unique emails across all records in the group
    const mergedEmails: any[] = [];
    const seenEmails = new Set<string>();
    for (const member of groupMembers) {
      if (Array.isArray(member.emails)) {
        for (const em of member.emails) {
          const val = (em.value || "").trim().toLowerCase();
          if (val && !seenEmails.has(val)) {
            seenEmails.add(val);
            mergedEmails.push({
              address: em.value,
              type: em.kind || "Work",
              isPrimary: mergedEmails.length === 0,
            });
          }
        }
      }
    }

    // Merge unique phones across all records in the group
    const mergedPhones: any[] = [];
    const seenPhones = new Set<string>();
    for (const member of groupMembers) {
      if (Array.isArray(member.phones)) {
        for (const ph of member.phones) {
          const digits = (ph.value || "").replace(/\D/g, "");
          const key = digits || ph.value;
          if (key && !seenPhones.has(key)) {
            seenPhones.add(key);
            mergedPhones.push({
              number: ph.value,
              type: ph.kind || "Mobile",
              isPrimary: mergedPhones.length === 0,
            });
          }
        }
      }
    }

    // Merge social media
    const socialMedia: any[] = [];
    const twitterHandle = groupMembers.find((m) => m.twitter_name)?.twitter_name;
    const linkedinUrl = groupMembers.find((m) => m.linkedin_url)?.linkedin_url;
    if (twitterHandle) socialMedia.push({ platform: "Twitter", handle: twitterHandle });
    if (linkedinUrl) socialMedia.push({ platform: "LinkedIn", url: linkedinUrl });

    // Build people row
    peopleRows.push({
      id: personUuid,
      prefix: primaryContact.prefix || null,
      firstName,
      middleName: primaryContact.middle_name || null,
      lastName,
      suffix: primaryContact.suffix || null,
      emails: JSON.stringify(mergedEmails),
      phones: JSON.stringify(mergedPhones),
      socialMedia: JSON.stringify(socialMedia),
      addresses: JSON.stringify(peopleAddressesFormatted),
      addressIds,
      createdAt: primaryContact.created_at ? new Date(primaryContact.created_at) : new Date(),
      updatedAt: primaryContact.updated_at ? new Date(primaryContact.updated_at) : new Date(),
    });

    const jobTitle = groupMembers.find((m) => m.job_title || m.occupation)?.job_title || groupMembers.find((m) => m.occupation)?.occupation || null;
    const orgName = groupMembers.find((m) => m.organization_name)?.organization_name || "";
    const startDate = groupMembers.find((m) => m.occupation_start_date)?.occupation_start_date || null;

    const employments = jobTitle || orgName
      ? [{ title: jobTitle || "Professional", employerName: orgName, startDate }]
      : [];

    const driversLicense = {
      number: groupMembers.find((m) => m.drivers_license_number)?.drivers_license_number || null,
      state: groupMembers.find((m) => m.drivers_license_state)?.drivers_license_state || null,
      issuedDate: groupMembers.find((m) => m.drivers_license_issued_date)?.drivers_license_issued_date || null,
      expiresDate: groupMembers.find((m) => m.drivers_license_expires_date)?.drivers_license_expires_date || null,
    };

    const pii = {
      ssn: groupMembers.find((m) => m.ssn)?.ssn || null,
      birthDate: groupMembers.find((m) => m.birth_date)?.birth_date || null,
      gender: groupMembers.find((m) => m.gender)?.gender || null,
      maritalStatus: groupMembers.find((m) => m.marital_status)?.marital_status || null,
      birthPlace: groupMembers.find((m) => m.birth_place)?.birth_place || null,
      maidenName: groupMembers.find((m) => m.maiden_name)?.maiden_name || null,
      passportNumber: groupMembers.find((m) => m.passport_number)?.passport_number || null,
      greenCardNumber: groupMembers.find((m) => m.green_card_number)?.green_card_number || null,
      smoker: groupMembers.find((m) => m.smoker !== null && m.smoker !== undefined)?.smoker ?? null,
      height: groupMembers.find((m) => m.height)?.height || null,
      weight: groupMembers.find((m) => m.weight)?.weight || null,
      medicalConditions: groupMembers.find((m) => m.medical_conditions)?.medical_conditions || null,
      personalInterests: groupMembers.find((m) => m.personal_interests)?.personal_interests || null,
      importantInformation: groupMembers.find((m) => m.important_information)?.important_information || null,
      agreements: {
        signedFeeAgreementDate: groupMembers.find((m) => m.signed_fee_agreement_date)?.signed_fee_agreement_date || null,
        signedIpsAgreementDate: groupMembers.find((m) => m.signed_ips_agreement_date)?.signed_ips_agreement_date || null,
        signedFpAgreementDate: groupMembers.find((m) => m.signed_fp_agreement_date)?.signed_fp_agreement_date || null,
        lastAdvOfferingDate: groupMembers.find((m) => m.last_adv_offering_date)?.last_adv_offering_date || null,
        initialCrsOfferingDate: groupMembers.find((m) => m.initial_crs_offering_date)?.initial_crs_offering_date || null,
        lastCrsOfferingDate: groupMembers.find((m) => m.last_crs_offering_date)?.last_crs_offering_date || null,
        lastPrivacyOfferingDate: groupMembers.find((m) => m.last_privacy_offering_date)?.last_privacy_offering_date || null,
      },
    };

    const mergedLiabilities = groupMembers.filter((m) => m.liabilities).map((m) => m.liabilities);

    clientsRows.push({
      id: clientUuid,
      personId: personUuid,
      employments: JSON.stringify(employments),
      driversLicense: JSON.stringify(driversLicense),
      pii: JSON.stringify(pii),
      liabilities: JSON.stringify(mergedLiabilities),
      createdAt: primaryContact.created_at ? new Date(primaryContact.created_at) : new Date(),
      updatedAt: primaryContact.updated_at ? new Date(primaryContact.updated_at) : new Date(),
    });

    // Merge tags from all group members and record as notes not imported
    const groupTags = new Set<string>();
    for (const member of groupMembers) {
      const tags = getContactTags(member);
      for (const t of tags) groupTags.add(t);
    }

    if (primaryResult && groupTags.size > 0) {
      primaryResult.notesNotImported = primaryResult.notesNotImported || [];
      for (const tag of groupTags) {
        primaryResult.notesNotImported.push({
          title: `Contact Tag: ${tag}`,
          contentSnippet: `Tag: ${tag}`,
          reason: "Contact Tag not imported as a note",
        });
      }
    }
  }

  console.log(`Deduplication summary: ${personGroups.size} unique people created from ${personContacts.length} source records. (${duplicatesMerged} duplicate records merged).`);

  // --- STEP 4: Build Organization & Household Batches ---
  console.log("\n--- STEP 4: Preparing Organizations & Households ---");

  for (const c of companyContacts) {
    const companyUuid = crypto.randomUUID();
    companyIdMap.set(c.id, companyUuid);

    const contactResult = contactResultsMap.get(c.id);
    if (contactResult) {
      contactResult.companyId = companyUuid;
      contactResult.entityType = "company";
    }

    let addressId: string | null = null;
    if (Array.isArray(c.addresses) && c.addresses.length > 0) {
      const resolved = getOrCreateAddress(c.addresses[0]);
      if (resolved) {
        addressId = resolved.id;
      }
    }

    const phone = c.phones && c.phones[0] ? c.phones[0].value : null;
    const website = c.websites && c.websites[0] ? c.websites[0].value : null;

    companiesRows.push({
      id: companyUuid,
      name: c.name,
      phone,
      website,
      addressId,
      createdAt: c.created_at ? new Date(c.created_at) : new Date(),
      updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
    });
  }

  for (const c of householdContacts) {
    const householdUuid = crypto.randomUUID();
    householdIdMap.set(c.id, householdUuid);

    const contactResult = contactResultsMap.get(c.id);
    if (contactResult) {
      contactResult.householdId = householdUuid;
      contactResult.entityType = "household";
    }

    let addressId: string | null = null;
    if (Array.isArray(c.addresses) && c.addresses.length > 0) {
      const resolved = getOrCreateAddress(c.addresses[0]);
      if (resolved) {
        addressId = resolved.id;
      }
    }

    const { lastName: hLastName, firstNames: hFirstNames } = parseHouseholdName(c.name || "");
    const membersList: Array<{ clientId: string; role: string }> = [];

    if (hLastName) {
      const matchingPeople = allPeople.filter(
        (p) => p.lastName.toLowerCase() === hLastName.toLowerCase()
      );

      let matchedIndex = 0;
      for (const fName of hFirstNames) {
        const found = matchingPeople.find(
          (p) => p.firstName.toLowerCase() === fName.toLowerCase()
        );
        if (found) {
          const role = matchedIndex === 0 ? "HEAD" : matchedIndex === 1 ? "SPOUSE" : "DEPENDENT";
          membersList.push({ clientId: found.clientId, role });
          matchedIndex++;
        }
      }

      if (membersList.length === 0 && matchingPeople.length > 0) {
        matchingPeople.forEach((p, idx) => {
          const role = idx === 0 ? "HEAD" : idx === 1 ? "SPOUSE" : "DEPENDENT";
          membersList.push({ clientId: p.clientId, role });
        });
      }
    }

    householdsRows.push({
      id: householdUuid,
      name: c.name,
      addressId,
      memberIds: JSON.stringify(membersList),
      createdAt: c.created_at ? new Date(c.created_at) : new Date(),
      updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
    });
  }

  // Company Employee links (with deduplication per company)
  const companyEmployeeMap = new Map<
    string,
    {
      companyId: string;
      personId: string;
      jobTitle: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  >();

  // 1. Link from person's organization_id
  for (const c of personContacts) {
    if (c.organization_id && companyIdMap.has(c.organization_id) && personIdMap.has(c.id)) {
      const companyId = companyIdMap.get(c.organization_id)!;
      const personId = personIdMap.get(c.id)!;
      const pairKey = `${companyId}|${personId}`;
      const jobTitle = (c.job_title || c.occupation || "").trim() || null;

      if (!companyEmployeeMap.has(pairKey)) {
        companyEmployeeMap.set(pairKey, {
          companyId,
          personId,
          jobTitle,
          createdAt: c.created_at ? new Date(c.created_at) : new Date(),
          updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
        });
      } else if (jobTitle && !companyEmployeeMap.get(pairKey)!.jobTitle) {
        companyEmployeeMap.get(pairKey)!.jobTitle = jobTitle;
      }
    }
  }

  // 2. Link from company's contact_related_contacts
  for (const c of companyContacts) {
    if (Array.isArray(c.contact_related_contacts) && companyIdMap.has(c.id)) {
      const companyId = companyIdMap.get(c.id)!;
      for (const rel of c.contact_related_contacts) {
        if (rel.related_contact_id && personIdMap.has(rel.related_contact_id)) {
          const personId = personIdMap.get(rel.related_contact_id)!;
          const pairKey = `${companyId}|${personId}`;
          const relTitle = rel.relationship && rel.relationship.trim() ? rel.relationship.trim() : null;

          if (!companyEmployeeMap.has(pairKey)) {
            companyEmployeeMap.set(pairKey, {
              companyId,
              personId,
              jobTitle: relTitle,
              createdAt: c.created_at ? new Date(c.created_at) : new Date(),
              updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
            });
          } else if (relTitle && !companyEmployeeMap.get(pairKey)!.jobTitle) {
            companyEmployeeMap.get(pairKey)!.jobTitle = relTitle;
          }
        }
      }
    }
  }

  for (const emp of companyEmployeeMap.values()) {
    companyEmployeesRows.push({
      id: crypto.randomUUID(),
      companyId: emp.companyId,
      personId: emp.personId,
      jobTitle: emp.jobTitle,
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
    });
  }

  // --- STEP 5: Prepare Notes & Comments Batches ---
  console.log("\n--- STEP 5: Preparing Notes & Comments ---");

  const noteResults: Array<{
    originalId: number;
    title: string;
    contentSnippet: string;
    createdAt: string;
    associatedContactId: number | null;
    associatedEntityId: string | null;
    entityType: string | null;
    status: "successful" | "ignored";
    reason: string;
  }> = [];

  for (const n of notes) {
    const noteContent = n.content || "";
    const rawTitle = n.title || "";
    const shortenedTitle = getShortenedTitle(noteContent);
    const createdAtStr = n.created_at || new Date().toISOString();
    const contentSnippet = noteContent.substring(0, 150);

    let targetContactId: number | null = null;
    let targetEntityType: "client" | "company" | "household" | null = null;
    let targetEntityId: string | null = null;
    let skipReason = "";

    const firstResource = Array.isArray(n.related_resources) && n.related_resources.length > 0
      ? n.related_resources[0]
      : null;

    if (firstResource && firstResource.id != null) {
      targetContactId = Number(firstResource.id);
      if (clientIdMap.has(targetContactId)) {
        targetEntityType = "client";
        targetEntityId = clientIdMap.get(targetContactId)!;
      } else if (companyIdMap.has(targetContactId)) {
        targetEntityType = "company";
        targetEntityId = companyIdMap.get(targetContactId)!;
      } else if (householdIdMap.has(targetContactId)) {
        targetEntityType = "household";
        targetEntityId = householdIdMap.get(targetContactId)!;
      } else {
        const contactResult = contactResultsMap.get(targetContactId);
        if (contactResult && contactResult.status === "ignored") {
          skipReason = `Associated contact ${targetContactId} was ignored (${contactResult.reason})`;
        } else {
          skipReason = `Associated contact ID ${targetContactId} not found in imported contacts`;
        }
      }
    } else {
      skipReason = "No valid related_resource ID found in first item of related_resources";
    }

    // Check if the note begins with "Contact Tag"
    const isContactTagNote =
      noteContent.trim().toLowerCase().startsWith("contact tag") ||
      rawTitle.trim().toLowerCase().startsWith("contact tag") ||
      shortenedTitle.toLowerCase().startsWith("contact tag");

    if (isContactTagNote) {
      const tagSkipReason = "Note begins with 'Contact Tag' (not imported as a note)";
      skippedItems.push({
        type: "note",
        legacyId: n.id,
        contentSnippet: contentSnippet.substring(0, 100),
        reason: tagSkipReason,
      });

      noteResults.push({
        originalId: n.id,
        title: shortenedTitle,
        contentSnippet,
        createdAt: createdAtStr,
        associatedContactId: targetContactId,
        associatedEntityId: targetEntityId,
        entityType: targetEntityType,
        status: "ignored",
        reason: tagSkipReason,
      });

      if (targetContactId && contactResultsMap.has(targetContactId)) {
        const targetResult = contactResultsMap.get(targetContactId)!;
        targetResult.notesNotImported = targetResult.notesNotImported || [];
        targetResult.notesNotImported.push({
          id: n.id,
          title: shortenedTitle,
          contentSnippet: contentSnippet.substring(0, 100),
          reason: tagSkipReason,
        });
      }
      continue;
    }

    if (targetEntityType && targetEntityId) {
      const noteUuid = crypto.randomUUID();
      const assocUuid = crypto.randomUUID();

      notesRows.push({
        id: noteUuid,
        parentId: null,
        rootId: noteUuid,
        depth: 0,
        title: shortenedTitle,
        body: noteContent,
        authorId: null,
        createdAt: n.created_at ? new Date(n.created_at) : new Date(),
        updatedAt: n.updated_at ? new Date(n.updated_at) : new Date(),
      });

      noteAssocRows.push({
        id: assocUuid,
        noteId: noteUuid,
        entityType: targetEntityType,
        entityId: targetEntityId,
        createdAt: new Date(),
      });

      noteResults.push({
        originalId: n.id,
        title: shortenedTitle,
        contentSnippet,
        createdAt: createdAtStr,
        associatedContactId: targetContactId,
        associatedEntityId: targetEntityId,
        entityType: targetEntityType,
        status: "successful",
        reason: `Matched to imported ${targetEntityType} (contact ID ${targetContactId})`,
      });
    } else {
      skippedItems.push({
        type: "note",
        legacyId: n.id,
        contentSnippet: contentSnippet.substring(0, 100),
        reason: skipReason,
      });

      noteResults.push({
        originalId: n.id,
        title: shortenedTitle,
        contentSnippet,
        createdAt: createdAtStr,
        associatedContactId: targetContactId,
        associatedEntityId: null,
        entityType: null,
        status: "ignored",
        reason: skipReason,
      });
    }
  }

  for (const cm of comments) {
    let targetEntityType: "client" | "company" | null = null;
    let targetEntityId: string | null = null;

    if (cm.resource_id) {
      if (clientIdMap.has(cm.resource_id)) {
        targetEntityType = "client";
        targetEntityId = clientIdMap.get(cm.resource_id)!;
      } else if (companyIdMap.has(cm.resource_id)) {
        targetEntityType = "company";
        targetEntityId = companyIdMap.get(cm.resource_id)!;
      }
    }

    if (targetEntityType && targetEntityId) {
      const noteUuid = crypto.randomUUID();
      const assocUuid = crypto.randomUUID();

      notesRows.push({
        id: noteUuid,
        parentId: null,
        rootId: noteUuid,
        depth: 0,
        title: getShortenedTitle(cm.content),
        body: cm.content || "",
        authorId: null,
        createdAt: cm.created_at ? new Date(cm.created_at) : new Date(),
        updatedAt: cm.updated_at ? new Date(cm.updated_at) : new Date(),
      });

      noteAssocRows.push({
        id: assocUuid,
        noteId: noteUuid,
        entityType: targetEntityType,
        entityId: targetEntityId,
        createdAt: new Date(),
      });
    } else {
      skippedItems.push({
        type: "comment",
        legacyId: cm.id,
        contentSnippet: (cm.content || "").substring(0, 100),
        reason: `No associated entity found for resource_type '${cm.resource_type}' (id: ${cm.resource_id})`,
      });
    }
  }

  // --- STEP 6: Execute Fast Bulk Writes to Postgres ---
  console.log("\n--- STEP 6: Executing Bulk Database Writes ---");

  // 1. Addresses
  if (addressesRows.length > 0) {
    console.log(`Flushing ${addressesRows.length} addresses...`);
    await flushBatch(addressesRows, 500, async (chunk) => {
      await sql`
        INSERT INTO addresses ${(sql as any)(chunk, "id", "street1", "street2", "city", "state", "zipCode", "country", "createdAt", "updatedAt")}
      `;
    });
  }

  // 2. People
  if (peopleRows.length > 0) {
    console.log(`Flushing ${peopleRows.length} people...`);
    await flushBatch(peopleRows, 500, async (chunk) => {
      await sql`
        INSERT INTO people ${(sql as any)(chunk, "id", "prefix", "firstName", "middleName", "lastName", "suffix", "emails", "phones", "socialMedia", "addresses", "addressIds", "createdAt", "updatedAt")}
      `;
    });
  }

  // 3. Clients
  if (clientsRows.length > 0) {
    console.log(`Flushing ${clientsRows.length} clients...`);
    await flushBatch(clientsRows, 500, async (chunk) => {
      await sql`
        INSERT INTO clients ${(sql as any)(chunk, "id", "personId", "employments", "driversLicense", "pii", "liabilities", "createdAt", "updatedAt")}
      `;
    });
  }

  // 4. Companies
  if (companiesRows.length > 0) {
    console.log(`Flushing ${companiesRows.length} companies...`);
    await flushBatch(companiesRows, 500, async (chunk) => {
      await sql`
        INSERT INTO companies ${(sql as any)(chunk, "id", "name", "phone", "website", "addressId", "createdAt", "updatedAt")}
      `;
    });
  }

  // 5. Households
  if (householdsRows.length > 0) {
    console.log(`Flushing ${householdsRows.length} households...`);
    await flushBatch(householdsRows, 500, async (chunk) => {
      await sql`
        INSERT INTO households ${(sql as any)(chunk, "id", "name", "addressId", "memberIds", "createdAt", "updatedAt")}
      `;
    });
  }

  // 6. Company Employees
  if (companyEmployeesRows.length > 0) {
    console.log(`Flushing ${companyEmployeesRows.length} company employees...`);
    await flushBatch(companyEmployeesRows, 500, async (chunk) => {
      await sql`
        INSERT INTO company_employees ${(sql as any)(chunk, "id", "companyId", "personId", "jobTitle", "createdAt", "updatedAt")}
      `;
    });
  }

  // 7. Notes
  if (notesRows.length > 0) {
    console.log(`Flushing ${notesRows.length} notes...`);
    await flushBatch(notesRows, 500, async (chunk) => {
      await sql`
        INSERT INTO notes ${(sql as any)(chunk, "id", "parentId", "rootId", "depth", "title", "body", "authorId", "createdAt", "updatedAt")}
      `;
    });
  }

  // 8. Note Associations
  if (noteAssocRows.length > 0) {
    console.log(`Flushing ${noteAssocRows.length} note associations...`);
    await flushBatch(noteAssocRows, 500, async (chunk) => {
      await sql`
        INSERT INTO note_associations ${(sql as any)(chunk, "id", "noteId", "entityType", "entityId", "createdAt")}
      `;
    });
  }

  // --- STEP 7: Generate Results JSON File ---
  console.log("\n--- STEP 7: Writing Migration Summary JSON ---");

  const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
  const duplicateAddressesMerged = totalAddressOccurrences - addressesRows.length;
  const multiEntityAddressesCount = Array.from(globalAddressMap.values()).filter((a) => a.entityCount > 1).length;

  const results = {
    timestamp: new Date().toISOString(),
    durationSeconds: Number(durationSeconds),
    summary: {
      totalContacts: contacts.length,
      importedContacts: contactsToImport.length,
      ignoredContacts: fdcMailingContacts.length + adcpaContacts.length,
      fdcMailingContacts: fdcMailingContacts.length,
      adcpaContacts: adcpaContacts.length,
      peopleInserted: peopleRows.length,
      clientsInserted: clientsRows.length,
      duplicatePeopleMerged: duplicatesMerged,
      nicknameConversionsCount: nicknameConversions.length,
      companiesInserted: companiesRows.length,
      companyEmployeesInserted: companyEmployeesRows.length,
      householdsInserted: householdsRows.length,
      addressesInserted: addressesRows.length,
      duplicateAddressesMerged,
      totalNotes: notes.length,
      importedNotes: notesRows.length,
      skippedNotes: noteResults.filter((nr) => nr.status === "ignored").length,
      totalNotesInsertedInDb: notesRows.length,
      noteAssociationsInserted: noteAssocRows.length,
    },
    deduplication: {
      peopleDeduplication: {
        totalDuplicatesDetected,
        uniquePeopleCreated: peopleRows.length,
        duplicatesMerged,
        nicknameConversionsCount: nicknameConversions.length,
        nicknameConversions,
      },
      addressDeduplication: {
        totalAddressOccurrences,
        uniqueAddressesCreated: addressesRows.length,
        duplicateAddressesMerged,
        multiEntityAddressesCount,
      },
      // Top-level aliases for backwards compatibility
      totalDuplicatesDetected,
      uniquePeopleCreated: peopleRows.length,
      duplicatesMerged,
      nicknameConversionsCount: nicknameConversions.length,
      nicknameConversions,
    },
    contacts: Array.from(contactResultsMap.values()),
    notes: noteResults,
    skippedItems,
  };

  const migrationDir = path.resolve(process.cwd(), "migration");
  if (!fs.existsSync(migrationDir)) {
    fs.mkdirSync(migrationDir, { recursive: true });
  }

  const resultsPath = path.resolve(migrationDir, "results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), "utf8");

  console.log(`\n================ MIGRATION SUCCESSFUL ===============`);
  console.log(`Duration: ${durationSeconds} seconds`);
  console.log(`Total Contacts: ${contacts.length} (${contactsToImport.length} imported, ${fdcMailingContacts.length + adcpaContacts.length} ignored)`);
  console.log(`  - FDC Mailing List CSV: ${fdcCsvPath} (${fdcMailingContacts.length} contacts)`);
  console.log(`  - ADCPA CSV: ${adcpaCsvPath} (${adcpaContacts.length} contacts)`);
  console.log(`Person Deduplication: ${duplicatesMerged} duplicate records merged, ${nicknameConversions.length} nickname transitions/merges recorded`);
  console.log(`Address Deduplication: ${duplicateAddressesMerged} duplicate address occurrences merged across ${multiEntityAddressesCount} shared locations (${addressesRows.length} unique addresses created)`);
  console.log(`People inserted: ${peopleRows.length}`);
  console.log(`Clients inserted: ${clientsRows.length}`);
  console.log(`Companies inserted: ${companiesRows.length}`);
  console.log(`Company Employees inserted: ${companyEmployeesRows.length}`);
  console.log(`Households inserted: ${householdsRows.length}`);
  console.log(`Addresses inserted: ${addressesRows.length}`);
  console.log(`Notes inserted: ${notesRows.length} (${noteResults.filter((nr) => nr.status === "ignored").length} notes skipped/not imported)`);
  console.log(`Note Associations inserted: ${noteAssocRows.length}`);
  console.log(`Skipped Items (Notes/Comments): ${skippedItems.length}`);
  console.log(`Detailed Results saved to: ${resultsPath}`);

  await sql.end();
}

runMigration().catch((err) => {
  console.error("Migration failed with error:", err);
  sql.end().then(() => process.exit(1));
});
