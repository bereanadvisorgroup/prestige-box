import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import postgres from "postgres";

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let dbUrl = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const activeLines = envContent.split("\n").map((l: string) => l.trim()).filter((l: string) => l && !l.startsWith("#"));
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

const sql = postgres(dbUrl, { max: 10 });

// Helper to extract shortened title from body content
function getShortenedTitle(content: string | null | undefined): string {
  if (!content) return "Imported Note";
  // Remove HTML tags and normalize whitespace
  const cleanStr = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (!cleanStr) return "Imported Note";

  const firstSentence = cleanStr.split(/(?<=[.?!])\s+/)[0] || cleanStr;
  if (firstSentence.length <= 60) {
    return firstSentence;
  }
  // Trim at word boundary up to 60 characters
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

async function runMigration() {
  const startTime = Date.now();
  const jsonPathArg = process.argv[2] || "scripts/20260801_ClientList_PP_Sample.json";
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
    TRUNCATE TABLE note_associations, notes, company_owners, households, companies, clients, people, addresses CASCADE;
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

  // In-memory maps (Legacy ID -> New UUID)
  const personIdMap = new Map<number, string>(); // legacy contact.id -> people.id UUID
  const clientIdMap = new Map<number, string>(); // legacy contact.id -> clients.id UUID
  const companyIdMap = new Map<number, string>(); // legacy contact.id -> companies.id UUID
  const householdIdMap = new Map<number, string>(); // legacy contact.id -> households.id UUID

  // To support household matching
  const allPeople: Array<{ legacyId: number; personId: string; clientId: string; firstName: string; lastName: string }> = [];

  let insertedAddressesCount = 0;
  let insertedPeopleCount = 0;
  let insertedClientsCount = 0;
  let insertedCompaniesCount = 0;
  let insertedHouseholdsCount = 0;
  let insertedTagNotesCount = 0;
  let insertedNotesCount = 0;
  let insertedNoteAssocCount = 0;
  let insertedCompanyOwnersCount = 0;

  const skippedItems: Array<{ type: string; legacyId: number; contentSnippet: string; reason: string }> = [];

  // Separate contact types
  const personContacts = contacts.filter((c: any) => c.type === "Person");
  const companyContacts = contacts.filter((c: any) => c.type === "Organization");
  const householdContacts = contacts.filter((c: any) => c.type === "Household");

  console.log(`\nFound ${personContacts.length} Person contacts, ${companyContacts.length} Organization contacts, ${householdContacts.length} Household contacts.`);

  // --- STEP 3: Process Person Contacts ---
  console.log("\n--- STEP 3: Ingesting Person Contacts & Addresses ---");

  for (const c of personContacts) {
    const personUuid = crypto.randomUUID();
    const clientUuid = crypto.randomUUID();

    personIdMap.set(c.id, personUuid);
    clientIdMap.set(c.id, clientUuid);

    const firstName = (c.first_name || "").trim() || (c.name || "").trim() || "Unknown";
    const lastName = (c.last_name || "").trim() || "Unknown";

    allPeople.push({
      legacyId: c.id,
      personId: personUuid,
      clientId: clientUuid,
      firstName,
      lastName,
    });

    // Process Addresses
    const addressIds: string[] = [];
    const peopleAddressesFormatted: any[] = [];

    if (Array.isArray(c.addresses)) {
      for (const addr of c.addresses) {
        const addrUuid = crypto.randomUUID();
        const street1 = (addr.street_line_1 || "").trim() || "N/A";
        const street2 = (addr.street_line_2 || "").trim() || null;
        const city = (addr.city || "").trim() || "N/A";
        const state = (addr.state || "").trim() || "N/A";
        const zipCode = (addr.zip_code || "").trim() || "N/A";
        const country = (addr.country || "").trim() || "USA";

        await sql`
          INSERT INTO addresses (id, street1, street2, city, state, "zipCode", country, "createdAt", "updatedAt")
          VALUES (${addrUuid}, ${street1}, ${street2}, ${city}, ${state}, ${zipCode}, ${country}, NOW(), NOW())
        `;
        insertedAddressesCount++;
        addressIds.push(addrUuid);
        peopleAddressesFormatted.push({
          id: addrUuid,
          street1,
          street2,
          city,
          state,
          zipCode,
          country,
          kind: addr.kind || "Main",
        });
      }
    }

    // Process Social Media
    const socialMedia: any[] = [];
    if (c.twitter_name) socialMedia.push({ platform: "Twitter", handle: c.twitter_name });
    if (c.linkedin_url) socialMedia.push({ platform: "LinkedIn", url: c.linkedin_url });

    // Insert People record
    await sql`
      INSERT INTO people (
        id, prefix, "firstName", "middleName", "lastName", suffix,
        emails, phones, "socialMedia", addresses, "addressIds",
        "createdAt", "updatedAt"
      )
      VALUES (
        ${personUuid}, ${c.prefix || null}, ${firstName}, ${c.middle_name || null}, ${lastName}, ${c.suffix || null},
        ${sql.json(c.emails || [])}, ${sql.json(c.phones || [])}, ${sql.json(socialMedia)}, ${sql.json(peopleAddressesFormatted)}, ${sql.array(addressIds)}::uuid[],
        ${c.created_at ? new Date(c.created_at) : new Date()}, ${c.updated_at ? new Date(c.updated_at) : new Date()}
      )
    `;
    insertedPeopleCount++;

    // Prepare Clients JSON fields
    const employments = c.job_title || c.occupation
      ? [{ title: c.job_title || c.occupation, startDate: c.occupation_start_date || null }]
      : [];

    const driversLicense = {
      number: c.drivers_license_number || null,
      state: c.drivers_license_state || null,
      issuedDate: c.drivers_license_issued_date || null,
      expiresDate: c.drivers_license_expires_date || null,
    };

    const pii = {
      ssn: c.ssn || null,
      birthDate: c.birth_date || null,
      gender: c.gender || null,
      maritalStatus: c.marital_status || null,
      birthPlace: c.birth_place || null,
      maidenName: c.maiden_name || null,
      passportNumber: c.passport_number || null,
      greenCardNumber: c.green_card_number || null,
      smoker: c.smoker ?? null,
      height: c.height || null,
      weight: c.weight || null,
      medicalConditions: c.medical_conditions || null,
      personalInterests: c.personal_interests || null,
      importantInformation: c.important_information || null,
      agreements: {
        signedFeeAgreementDate: c.signed_fee_agreement_date || null,
        signedIpsAgreementDate: c.signed_ips_agreement_date || null,
        signedFpAgreementDate: c.signed_fp_agreement_date || null,
        lastAdvOfferingDate: c.last_adv_offering_date || null,
        initialCrsOfferingDate: c.initial_crs_offering_date || null,
        lastCrsOfferingDate: c.last_crs_offering_date || null,
        lastPrivacyOfferingDate: c.last_privacy_offering_date || null,
      },
    };

    const liabilities = c.liabilities ? [c.liabilities] : [];

    // Insert Clients record
    await sql`
      INSERT INTO clients (
        id, "personId", employments, "driversLicense", pii, liabilities, "createdAt", "updatedAt"
      )
      VALUES (
        ${clientUuid}, ${personUuid}, ${sql.json(employments)}, ${sql.json(driversLicense)},
        ${sql.json(pii)}, ${sql.json(liabilities)},
        ${c.created_at ? new Date(c.created_at) : new Date()}, ${c.updated_at ? new Date(c.updated_at) : new Date()}
      )
    `;
    insertedClientsCount++;

    // Process Tags -> Add as Note linked to Person/Client
    if (c.tags && typeof c.tags === "string" && c.tags.trim() !== "") {
      const tagList = c.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      for (const tag of tagList) {
        const noteUuid = crypto.randomUUID();
        const assocUuid = crypto.randomUUID();
        const title = `Contact Tag: ${tag}`;
        const body = `Imported Tag: ${tag}`;

        await sql`
          INSERT INTO notes (id, "parentId", "rootId", depth, title, body, "authorId", "createdAt", "updatedAt")
          VALUES (${noteUuid}, NULL, ${noteUuid}, 0, ${title}, ${body}, NULL, ${c.created_at ? new Date(c.created_at) : new Date()}, NOW())
        `;
        await sql`
          INSERT INTO note_associations (id, "noteId", "entityType", "entityId", "createdAt")
          VALUES (${assocUuid}, ${noteUuid}, 'client', ${clientUuid}, NOW())
        `;
        insertedTagNotesCount++;
        insertedNotesCount++;
        insertedNoteAssocCount++;
      }
    }
  }

  // --- STEP 4: Process Organization Contacts ---
  console.log("\n--- STEP 4: Ingesting Organization Contacts ---");

  for (const c of companyContacts) {
    const companyUuid = crypto.randomUUID();
    companyIdMap.set(c.id, companyUuid);

    let addressId: string | null = null;
    if (Array.isArray(c.addresses) && c.addresses.length > 0) {
      const addr = c.addresses[0];
      const addrUuid = crypto.randomUUID();
      const street1 = (addr.street_line_1 || "").trim() || "N/A";
      const street2 = (addr.street_line_2 || "").trim() || null;
      const city = (addr.city || "").trim() || "N/A";
      const state = (addr.state || "").trim() || "N/A";
      const zipCode = (addr.zip_code || "").trim() || "N/A";
      const country = (addr.country || "").trim() || "USA";

      await sql`
        INSERT INTO addresses (id, street1, street2, city, state, "zipCode", country, "createdAt", "updatedAt")
        VALUES (${addrUuid}, ${street1}, ${street2}, ${city}, ${state}, ${zipCode}, ${country}, NOW(), NOW())
      `;
      insertedAddressesCount++;
      addressId = addrUuid;
    }

    const phone = c.phones && c.phones[0] ? c.phones[0].value : null;
    const website = c.websites && c.websites[0] ? c.websites[0].value : null;

    await sql`
      INSERT INTO companies (id, name, phone, website, "addressId", "createdAt", "updatedAt")
      VALUES (${companyUuid}, ${c.name}, ${phone}, ${website}, ${addressId}, ${c.created_at ? new Date(c.created_at) : new Date()}, ${c.updated_at ? new Date(c.updated_at) : new Date()})
    `;
    insertedCompaniesCount++;
  }

  // --- STEP 5: Process Household Contacts ---
  console.log("\n--- STEP 5: Ingesting Household Contacts & Matching Members ---");

  for (const c of householdContacts) {
    const householdUuid = crypto.randomUUID();
    householdIdMap.set(c.id, householdUuid);

    let addressId: string | null = null;
    if (Array.isArray(c.addresses) && c.addresses.length > 0) {
      const addr = c.addresses[0];
      const addrUuid = crypto.randomUUID();
      const street1 = (addr.street_line_1 || "").trim() || "N/A";
      const street2 = (addr.street_line_2 || "").trim() || null;
      const city = (addr.city || "").trim() || "N/A";
      const state = (addr.state || "").trim() || "N/A";
      const zipCode = (addr.zip_code || "").trim() || "N/A";
      const country = (addr.country || "").trim() || "USA";

      await sql`
        INSERT INTO addresses (id, street1, street2, city, state, "zipCode", country, "createdAt", "updatedAt")
        VALUES (${addrUuid}, ${street1}, ${street2}, ${city}, ${state}, ${zipCode}, ${country}, NOW(), NOW())
      `;
      insertedAddressesCount++;
      addressId = addrUuid;
    }

    // Household name parsing and client member matching
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

      // If first names didn't match directly but people exist with same last name
      if (membersList.length === 0 && matchingPeople.length > 0) {
        matchingPeople.forEach((p, idx) => {
          const role = idx === 0 ? "HEAD" : idx === 1 ? "SPOUSE" : "DEPENDENT";
          membersList.push({ clientId: p.clientId, role });
        });
      }
    }

    await sql`
      INSERT INTO households (id, name, "addressId", "memberIds", "createdAt", "updatedAt")
      VALUES (${householdUuid}, ${c.name}, ${addressId}, ${sql.json(membersList)}, ${c.created_at ? new Date(c.created_at) : new Date()}, ${c.updated_at ? new Date(c.updated_at) : new Date()})
    `;
    insertedHouseholdsCount++;
  }

  // --- STEP 6: Process Company-Client Relationships ---
  console.log("\n--- STEP 6: Processing Company & Person Associations ---");

  const companyClientMap = new Map<string, Set<string>>(); // companyUuid -> Set of clientUuids

  // 1. Person contacts with organization_id
  for (const c of personContacts) {
    if (c.organization_id && companyIdMap.has(c.organization_id)) {
      const companyUuid = companyIdMap.get(c.organization_id)!;
      const personUuid = personIdMap.get(c.id)!;
      const clientUuid = clientIdMap.get(c.id)!;

      const ownerUuid = crypto.randomUUID();
      await sql`
        INSERT INTO company_owners (id, "companyId", "personId", "ownershipPercentage", "createdAt", "updatedAt")
        VALUES (${ownerUuid}, ${companyUuid}, ${personUuid}, 0.00, NOW(), NOW())
      `;
      insertedCompanyOwnersCount++;

      if (!companyClientMap.has(companyUuid)) companyClientMap.set(companyUuid, new Set());
      companyClientMap.get(companyUuid)!.add(clientUuid);
    }
  }

  // 2. Organization contacts with contact_related_contacts
  for (const c of companyContacts) {
    const companyUuid = companyIdMap.get(c.id)!;
    if (Array.isArray(c.contact_related_contacts)) {
      for (const rel of c.contact_related_contacts) {
        if (rel.related_contact_id && personIdMap.has(rel.related_contact_id)) {
          const personUuid = personIdMap.get(rel.related_contact_id)!;
          const clientUuid = clientIdMap.get(rel.related_contact_id)!;

          const ownerUuid = crypto.randomUUID();
          await sql`
            INSERT INTO company_owners (id, "companyId", "personId", "ownershipPercentage", "createdAt", "updatedAt")
            VALUES (${ownerUuid}, ${companyUuid}, ${personUuid}, 0.00, NOW(), NOW())
          `;
          insertedCompanyOwnersCount++;

          if (!companyClientMap.has(companyUuid)) companyClientMap.set(companyUuid, new Set());
          companyClientMap.get(companyUuid)!.add(clientUuid);
        }
      }
    }
  }



  // --- STEP 7: Ingest Notes & Comments ---
  console.log("\n--- STEP 7: Ingesting Notes & Comments ---");

  // Ingest Notes
  for (const n of notes) {
    let targetEntityType: "client" | "company" | null = null;
    let targetEntityId: string | null = null;

    if (Array.isArray(n.related_resources)) {
      for (const res of n.related_resources) {
        if (res.id) {
          if (clientIdMap.has(res.id)) {
            targetEntityType = "client";
            targetEntityId = clientIdMap.get(res.id)!;
            break;
          } else if (companyIdMap.has(res.id)) {
            targetEntityType = "company";
            targetEntityId = companyIdMap.get(res.id)!;
            break;
          }
        }
      }
    }

    if (targetEntityType && targetEntityId) {
      const noteUuid = crypto.randomUUID();
      const assocUuid = crypto.randomUUID();
      const title = getShortenedTitle(n.content);
      const body = n.content || "";

      await sql`
        INSERT INTO notes (id, "parentId", "rootId", depth, title, body, "authorId", "createdAt", "updatedAt")
        VALUES (${noteUuid}, NULL, ${noteUuid}, 0, ${title}, ${body}, NULL, ${n.created_at ? new Date(n.created_at) : new Date()}, ${n.updated_at ? new Date(n.updated_at) : new Date()})
      `;
      await sql`
        INSERT INTO note_associations (id, "noteId", "entityType", "entityId", "createdAt")
        VALUES (${assocUuid}, ${noteUuid}, ${targetEntityType}, ${targetEntityId}, NOW())
      `;
      insertedNotesCount++;
      insertedNoteAssocCount++;
    } else {
      skippedItems.push({
        type: "note",
        legacyId: n.id,
        contentSnippet: (n.content || "").substring(0, 100),
        reason: "No associated entity found in people/companies",
      });
    }
  }

  // Ingest Comments
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
      const title = getShortenedTitle(cm.content);
      const body = cm.content || "";

      await sql`
        INSERT INTO notes (id, "parentId", "rootId", depth, title, body, "authorId", "createdAt", "updatedAt")
        VALUES (${noteUuid}, NULL, ${noteUuid}, 0, ${title}, ${body}, NULL, ${cm.created_at ? new Date(cm.created_at) : new Date()}, ${cm.updated_at ? new Date(cm.updated_at) : new Date()})
      `;
      await sql`
        INSERT INTO note_associations (id, "noteId", "entityType", "entityId", "createdAt")
        VALUES (${assocUuid}, ${noteUuid}, ${targetEntityType}, ${targetEntityId}, NOW())
      `;
      insertedNotesCount++;
      insertedNoteAssocCount++;
    } else {
      skippedItems.push({
        type: "comment",
        legacyId: cm.id,
        contentSnippet: (cm.content || "").substring(0, 100),
        reason: `No associated entity found for resource_type '${cm.resource_type}' (id: ${cm.resource_id})`,
      });
    }
  }

  // --- STEP 8: Generate Results JSON File ---
  console.log("\n--- STEP 8: Writing Migration Summary JSON ---");

  const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

  const results = {
    timestamp: new Date().toISOString(),
    durationSeconds: Number(durationSeconds),
    counts: {
      people: insertedPeopleCount,
      clients: insertedClientsCount,
      companies: insertedCompaniesCount,
      households: insertedHouseholdsCount,
      addresses: insertedAddressesCount,
      tagNotes: insertedTagNotesCount,
      totalNotes: insertedNotesCount,
      noteAssociations: insertedNoteAssocCount,
      companyOwners: insertedCompanyOwnersCount,
    },
    skippedCounts: {
      totalSkipped: skippedItems.length,
      skippedNotes: skippedItems.filter((i) => i.type === "note").length,
      skippedComments: skippedItems.filter((i) => i.type === "comment").length,
    },
    skippedItems,
  };

  const resultsPath = path.resolve(process.cwd(), "scripts/migration_results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), "utf8");

  console.log(`\n================ MIGRATION SUCCESSFUL ===============`);
  console.log(`Duration: ${durationSeconds} seconds`);
  console.log(`People inserted: ${insertedPeopleCount}`);
  console.log(`Clients inserted: ${insertedClientsCount}`);
  console.log(`Companies inserted: ${insertedCompaniesCount}`);
  console.log(`Households inserted: ${insertedHouseholdsCount}`);
  console.log(`Addresses inserted: ${insertedAddressesCount}`);
  console.log(`Notes inserted: ${insertedNotesCount} (including ${insertedTagNotesCount} tag notes)`);
  console.log(`Note Associations inserted: ${insertedNoteAssocCount}`);
  console.log(`Company Owners inserted: ${insertedCompanyOwnersCount}`);
  console.log(`Skipped Notes/Comments: ${skippedItems.length}`);
  console.log(`Results saved to: ${resultsPath}`);

  await sql.end();
}

runMigration().catch((err) => {
  console.error("Migration failed with error:", err);
  sql.end().then(() => process.exit(1));
});
