import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { faker } from "@faker-js/faker";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Safety Check: Never run in production
if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENVIRONMENT === "production") {
  console.error("CRITICAL: Seeding is disabled in production environments.");
  process.exit(1);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "prestige-box-505310";

function getAccessToken(): string {
  try {
    const configPath = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return data?.tokens?.access_token || "";
    }
  } catch (err) {
    console.warn("Could not read access token from firebase-tools.json:", err);
  }
  return "";
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === "string") return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === "object") {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function setDocREST(token: string, col: string, docId: string, data: Record<string, any>) {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = toFirestoreValue(v);
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${col}/${docId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error(`Failed to set document ${col}/${docId}: ${res.status} ${txt}`);
  }
}

async function main() {
  console.log("🚀 Starting Firestore database seeding via Firebase Admin API...");

  const token = getAccessToken();
  if (!token) {
    console.error("❌ No Firebase CLI access token found. Please ensure you are logged into Firebase CLI.");
    process.exit(1);
  }

  try {
    // 1. Seed Users
    console.log("👥 Seeding users collection for Matt Duvall and default accounts...");

    const defaultUsers = [
      {
        uid: "matt-duvall-admin-uid",
        email: "matt@prestigeprivateclient.com",
        firstName: "Matt",
        lastName: "Duvall",
        role: "admin",
      },
      {
        uid: "alex-admin-uid",
        email: "admin@prestigebox.dev",
        firstName: "Alex",
        lastName: "Admin",
        role: "admin",
      },
      {
        uid: "sarah-advisor-uid",
        email: "advisor1@prestigebox.dev",
        firstName: "Sarah",
        lastName: "Advisor",
        role: "advisor",
      },
      {
        uid: "michael-advisor-uid",
        email: "advisor2@prestigebox.dev",
        firstName: "Michael",
        lastName: "Advisor",
        role: "advisor",
      },
      {
        uid: "chris-client-uid",
        email: "client1@prestigebox.dev",
        firstName: "Chris",
        lastName: "Client",
        role: "client",
      },
      {
        uid: "courtney-client-uid",
        email: "client2@prestigebox.dev",
        firstName: "Courtney",
        lastName: "Customer",
        role: "client",
      },
    ];

    const assignableUserIds: string[] = [];

    for (const u of defaultUsers) {
      const userDoc = {
        uid: u.uid,
        id: u.uid,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        photoURL: faker.image.avatar(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDocREST(token, "users", u.uid, userDoc);
      console.log(`Saved user document for ${u.email} (${u.role})`);

      if (u.role === "admin" || u.role === "advisor") {
        assignableUserIds.push(u.uid);
      }
    }

    // 2. Seed Addresses
    console.log("📍 Seeding addresses...");
    const addressList: any[] = [];
    for (let i = 0; i < 20; i++) {
      const id = faker.string.uuid();
      const addr = {
        id,
        street1: faker.location.streetAddress(),
        street2: faker.helpers.maybe(() => faker.location.secondaryAddress(), { probability: 0.3 }) || null,
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode(),
        country: "USA",
      };
      addressList.push(addr);
      await setDocREST(token, "addresses", id, addr);
    }

    // 3. Seed People
    console.log("👤 Seeding people...");
    const peopleList: any[] = [];
    for (let i = 0; i < 25; i++) {
      const id = faker.string.uuid();
      const fName = faker.person.firstName();
      const lName = faker.person.lastName();
      const person = {
        id,
        prefix: faker.helpers.maybe(() => faker.person.prefix(), { probability: 0.3 }) || null,
        firstName: fName,
        middleName: faker.person.middleName(),
        lastName: lName,
        suffix: faker.helpers.maybe(() => faker.person.suffix(), { probability: 0.1 }) || null,
        photoUrl: faker.image.avatar(),
        emails: [
          {
            id: faker.string.uuid(),
            address: faker.internet.email({ firstName: fName, lastName: lName }),
            type: "Personal",
            isPrimary: true,
          },
        ],
        phones: [
          {
            id: faker.string.uuid(),
            number: faker.phone.number(),
            type: "Mobile",
            isPrimary: true,
          },
        ],
        addresses: addressList.slice(0, 1),
        addressIds: [addressList[0].id],
        birthDate: faker.date.birthdate({ min: 25, max: 70, mode: "age" }).toISOString().split("T")[0],
        gender: faker.helpers.arrayElement(["Male", "Female", "Other"]),
        maritalStatus: faker.helpers.arrayElement(["Single", "Married", "Divorced", "Widowed"]),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      peopleList.push(person);
      await setDocREST(token, "people", id, person);
    }

    // 4. Seed Professional Entities
    console.log("🏢 Seeding professional firms...");
    const firmCollections = [
      "accounting_firms",
      "actuarial_firms",
      "banks",
      "insurance_agencies",
      "law_firms",
      "money_managers",
      "property_and_casualty_firms",
      "record_keepers",
      "life_insurance_companies",
      "disability_insurance_companies",
      "long_term_care_insurance",
    ];

    const firmIdsMap: Record<string, string[]> = {};

    for (const col of firmCollections) {
      firmIdsMap[col] = [];
      for (let i = 0; i < 3; i++) {
        const id = faker.string.uuid();
        firmIdsMap[col].push(id);
        const firm = {
          id,
          name: `${faker.company.name()} ${col.replace(/_/g, " ").slice(0, -1)}`,
          phone: faker.phone.number(),
          email: faker.internet.email(),
          website: faker.internet.url(),
          clientIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDocREST(token, col, id, firm);
      }
    }

    // 5. Seed Clients
    console.log("💼 Seeding clients...");
    const clientList: any[] = [];
    for (let i = 0; i < Math.min(15, peopleList.length); i++) {
      const id = faker.string.uuid();
      const person = peopleList[i];
      const client = {
        id,
        personId: person.id,
        person,
        advisorId: faker.helpers.arrayElement(assignableUserIds),
        status: faker.helpers.arrayElement(["Active", "Lead", "Onboarding", "Archived"]),
        segment: faker.helpers.arrayElement(["Tier 1", "Tier 2", "Tier 3"]),
        hobbies: [faker.music.genre(), faker.company.buzzNoun()],
        favoriteSportsTeams: [`${faker.location.city()} ${faker.animal.type()}`],
        paymentAccounts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      clientList.push(client);
      await setDocREST(token, "clients", id, client);
    }

    // 6. Seed Companies & Households
    console.log("🏡 Seeding households and companies...");
    for (let i = 0; i < 5; i++) {
      const hId = faker.string.uuid();
      const household = {
        id: hId,
        name: `${faker.person.lastName()} Household`,
        advisorId: faker.helpers.arrayElement(assignableUserIds),
        clientIds: clientList.slice(i, i + 2).map((c) => c.id),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDocREST(token, "households", hId, household);

      const cId = faker.string.uuid();
      const company = {
        id: cId,
        name: faker.company.name(),
        ein: faker.string.numeric(9),
        industry: faker.company.buzzNoun(),
        clientIds: clientList.slice(i, i + 2).map((c) => c.id),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDocREST(token, "companies", cId, company);
    }

    // 7. Seed Tasks & Notes
    console.log("📝 Seeding tasks and notes...");
    for (let i = 0; i < 10; i++) {
      const taskId = faker.string.uuid();
      const client = faker.helpers.arrayElement(clientList);
      const task = {
        id: taskId,
        title: faker.hacker.phrase(),
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(["Todo", "In Progress", "Done"]),
        priority: faker.helpers.arrayElement(["Low", "Medium", "High"]),
        dueDate: faker.date.future().toISOString().split("T")[0],
        assigneeIds: [faker.helpers.arrayElement(assignableUserIds)],
        clientId: client.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDocREST(token, "tasks", taskId, task);

      const noteId = faker.string.uuid();
      const note = {
        id: noteId,
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(2),
        clientId: client.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDocREST(token, "notes", noteId, note);
    }

    console.log("✅ Firestore database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding Firestore database:", error);
    process.exit(1);
  }
}

main();
