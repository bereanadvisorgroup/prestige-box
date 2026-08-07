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
  const rawArg = process.argv[2] || "scripts/20260801_ClientList.json";
  const jsonPathArg = rawArg.replace(/^['"]|['"]$/g, "");
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
  const personIdMap = new Map<number, string>();
  const clientIdMap = new Map<number, string>();
  const companyIdMap = new Map<number, string>();
  const householdIdMap = new Map<number, string>();

  const allPeople: Array<{ legacyId: number; personId: string; clientId: string; firstName: string; lastName: string }> = [];

  const personContacts = contacts.filter((c: any) => c.type === "Person");
  const companyContacts = contacts.filter((c: any) => c.type === "Organization");
  const householdContacts = contacts.filter((c: any) => c.type === "Household");

  console.log(`\nFound ${personContacts.length} Person contacts, ${companyContacts.length} Organization contacts, ${householdContacts.length} Household contacts.`);

  // Prepare batch buffers
  const addressesRows: any[] = [];
  const peopleRows: any[] = [];
  const clientsRows: any[] = [];
  const companiesRows: any[] = [];
  const householdsRows: any[] = [];
  const tagNotesRows: any[] = [];
  const tagAssocRows: any[] = [];
  const companyOwnersRows: any[] = [];
  const notesRows: any[] = [];
  const noteAssocRows: any[] = [];

  const skippedItems: Array<{ type: string; legacyId: number; contentSnippet: string; reason: string }> = [];

  // --- STEP 3: Build Person & Address Row Batches ---
  console.log("\n--- STEP 3: Preparing Person Contacts & Addresses ---");

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

        addressesRows.push({
          id: addrUuid,
          street1,
          street2,
          city,
          state,
          zipCode,
          country,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

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

    const socialMedia: any[] = [];
    if (c.twitter_name) socialMedia.push({ platform: "Twitter", handle: c.twitter_name });
    if (c.linkedin_url) socialMedia.push({ platform: "LinkedIn", url: c.linkedin_url });

    peopleRows.push({
      id: personUuid,
      prefix: c.prefix || null,
      firstName,
      middleName: c.middle_name || null,
      lastName,
      suffix: c.suffix || null,
      emails: JSON.stringify(c.emails || []),
      phones: JSON.stringify(c.phones || []),
      socialMedia: JSON.stringify(socialMedia),
      addresses: JSON.stringify(peopleAddressesFormatted),
      addressIds,
      createdAt: c.created_at ? new Date(c.created_at) : new Date(),
      updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
    });

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

    clientsRows.push({
      id: clientUuid,
      personId: personUuid,
      employments: JSON.stringify(employments),
      driversLicense: JSON.stringify(driversLicense),
      pii: JSON.stringify(pii),
      liabilities: JSON.stringify(c.liabilities ? [c.liabilities] : []),
      createdAt: c.created_at ? new Date(c.created_at) : new Date(),
      updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
    });

    if (c.tags && typeof c.tags === "string" && c.tags.trim() !== "") {
      const tagList = c.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      for (const tag of tagList) {
        const noteUuid = crypto.randomUUID();
        const assocUuid = crypto.randomUUID();

        tagNotesRows.push({
          id: noteUuid,
          parentId: null,
          rootId: noteUuid,
          depth: 0,
          title: `Contact Tag: ${tag}`,
          body: `Imported Tag: ${tag}`,
          authorId: null,
          createdAt: c.created_at ? new Date(c.created_at) : new Date(),
          updatedAt: new Date(),
        });

        tagAssocRows.push({
          id: assocUuid,
          noteId: noteUuid,
          entityType: "client",
          entityId: clientUuid,
          createdAt: new Date(),
        });
      }
    }
  }

  // --- STEP 4: Build Organization & Household Batches ---
  console.log("\n--- STEP 4: Preparing Organizations & Households ---");

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

      addressesRows.push({
        id: addrUuid,
        street1,
        street2,
        city,
        state,
        zipCode,
        country,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      addressId = addrUuid;
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

      addressesRows.push({
        id: addrUuid,
        street1,
        street2,
        city,
        state,
        zipCode,
        country,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      addressId = addrUuid;
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

  // Company Owner links
  for (const c of personContacts) {
    if (c.organization_id && companyIdMap.has(c.organization_id)) {
      companyOwnersRows.push({
        id: crypto.randomUUID(),
        companyId: companyIdMap.get(c.organization_id)!,
        personId: personIdMap.get(c.id)!,
        ownershipPercentage: 0.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  for (const c of companyContacts) {
    const companyUuid = companyIdMap.get(c.id)!;
    if (Array.isArray(c.contact_related_contacts)) {
      for (const rel of c.contact_related_contacts) {
        if (rel.related_contact_id && personIdMap.has(rel.related_contact_id)) {
          companyOwnersRows.push({
            id: crypto.randomUUID(),
            companyId: companyUuid,
            personId: personIdMap.get(rel.related_contact_id)!,
            ownershipPercentage: 0.0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }
  }

  // --- STEP 5: Prepare Notes & Comments Batches ---
  console.log("\n--- STEP 5: Preparing Notes & Comments ---");

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

      notesRows.push({
        id: noteUuid,
        parentId: null,
        rootId: noteUuid,
        depth: 0,
        title: getShortenedTitle(n.content),
        body: n.content || "",
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
    } else {
      skippedItems.push({
        type: "note",
        legacyId: n.id,
        contentSnippet: (n.content || "").substring(0, 100),
        reason: "No associated entity found in people/companies",
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
        INSERT INTO addresses ${sql(chunk, "id", "street1", "street2", "city", "state", "zipCode", "country", "createdAt", "updatedAt")}
      `;
    });
  }

  // 2. People
  if (peopleRows.length > 0) {
    console.log(`Flushing ${peopleRows.length} people...`);
    await flushBatch(peopleRows, 500, async (chunk) => {
      await sql`
        INSERT INTO people ${sql(chunk, "id", "prefix", "firstName", "middleName", "lastName", "suffix", "emails", "phones", "socialMedia", "addresses", "addressIds", "createdAt", "updatedAt")}
      `;
    });
  }

  // 3. Clients
  if (clientsRows.length > 0) {
    console.log(`Flushing ${clientsRows.length} clients...`);
    await flushBatch(clientsRows, 500, async (chunk) => {
      await sql`
        INSERT INTO clients ${sql(chunk, "id", "personId", "employments", "driversLicense", "pii", "liabilities", "createdAt", "updatedAt")}
      `;
    });
  }

  // 4. Companies
  if (companiesRows.length > 0) {
    console.log(`Flushing ${companiesRows.length} companies...`);
    await flushBatch(companiesRows, 500, async (chunk) => {
      await sql`
        INSERT INTO companies ${sql(chunk, "id", "name", "phone", "website", "addressId", "createdAt", "updatedAt")}
      `;
    });
  }

  // 5. Households
  if (householdsRows.length > 0) {
    console.log(`Flushing ${householdsRows.length} households...`);
    await flushBatch(householdsRows, 500, async (chunk) => {
      await sql`
        INSERT INTO households ${sql(chunk, "id", "name", "addressId", "memberIds", "createdAt", "updatedAt")}
      `;
    });
  }

  // 6. Company Owners
  if (companyOwnersRows.length > 0) {
    console.log(`Flushing ${companyOwnersRows.length} company owners...`);
    await flushBatch(companyOwnersRows, 500, async (chunk) => {
      await sql`
        INSERT INTO company_owners ${sql(chunk, "id", "companyId", "personId", "ownershipPercentage", "createdAt", "updatedAt")}
      `;
    });
  }

  // 7. Notes (Tag notes + Imported notes)
  const allNotesRows = [...tagNotesRows, ...notesRows];
  if (allNotesRows.length > 0) {
    console.log(`Flushing ${allNotesRows.length} notes...`);
    await flushBatch(allNotesRows, 500, async (chunk) => {
      await sql`
        INSERT INTO notes ${sql(chunk, "id", "parentId", "rootId", "depth", "title", "body", "authorId", "createdAt", "updatedAt")}
      `;
    });
  }

  // 8. Note Associations
  const allNoteAssocRows = [...tagAssocRows, ...noteAssocRows];
  if (allNoteAssocRows.length > 0) {
    console.log(`Flushing ${allNoteAssocRows.length} note associations...`);
    await flushBatch(allNoteAssocRows, 500, async (chunk) => {
      await sql`
        INSERT INTO note_associations ${sql(chunk, "id", "noteId", "entityType", "entityId", "createdAt")}
      `;
    });
  }

  // --- STEP 7: Generate Results JSON File ---
  console.log("\n--- STEP 7: Writing Migration Summary JSON ---");

  const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

  const results = {
    timestamp: new Date().toISOString(),
    durationSeconds: Number(durationSeconds),
    counts: {
      people: peopleRows.length,
      clients: clientsRows.length,
      companies: companiesRows.length,
      households: householdsRows.length,
      addresses: addressesRows.length,
      tagNotes: tagNotesRows.length,
      totalNotes: allNotesRows.length,
      noteAssociations: allNoteAssocRows.length,
      companyOwners: companyOwnersRows.length,
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
  console.log(`People inserted: ${peopleRows.length}`);
  console.log(`Clients inserted: ${clientsRows.length}`);
  console.log(`Companies inserted: ${companiesRows.length}`);
  console.log(`Households inserted: ${householdsRows.length}`);
  console.log(`Addresses inserted: ${addressesRows.length}`);
  console.log(`Notes inserted: ${allNotesRows.length} (including ${tagNotesRows.length} tag notes)`);
  console.log(`Note Associations inserted: ${allNoteAssocRows.length}`);
  console.log(`Company Owners inserted: ${companyOwnersRows.length}`);
  console.log(`Skipped Notes/Comments: ${skippedItems.length}`);
  console.log(`Results saved to: ${resultsPath}`);

  await sql.end();
}

runMigration().catch((err) => {
  console.error("Migration failed with error:", err);
  sql.end().then(() => process.exit(1));
});
