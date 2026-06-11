import { faker } from "@faker-js/faker";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { jsonb, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

import path from "node:path";

// Load environment variables from .env.local in development
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Safety Check: Never run in production
if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENVIRONMENT === "production") {
  console.error("CRITICAL: Seeding is disabled in production environments.");
  process.exit(1);
}

// Import database and schema files using relative paths
import { db } from "./index";
import {
  accountants,
  addresses,
  clientPolicies,
  clients,
  companies,
  households,
  insuranceCompanies,
  lawyers,
  people,
  users,
} from "./schema";

// Define the Supabase auth schema and users table to sync local auth accounts
const authSchema = pgSchema("auth");
const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email").unique().notNull(),
  encryptedPassword: text("encrypted_password"),
  emailConfirmedAt: timestamp("email_confirmed_at", { withTimezone: true }),
  rawAppMetaData: jsonb("raw_app_meta_data"),
  rawUserMetaData: jsonb("raw_user_meta_data"),
  aud: text("aud"),
  role: text("role"),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

interface PaymentAccount {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  routingNumber: string;
}

async function main() {
  console.log("🚀 Starting database seeding...");

  try {
    // 1. Clean up existing data in correct order
    console.log("🧹 Cleaning up existing CRM records...");

    await db.delete(clientPolicies);
    await db.delete(lawyers);
    await db.delete(accountants);
    await db.delete(companies);
    await db.delete(clients);
    await db.delete(households);
    await db.delete(people);
    await db.delete(addresses);
    // Note: To preserve existing developer auth accounts, we do NOT delete users or authUsers!

    console.log("✨ Cleanup completed.");

    // 2. Fetch and Seed Auth & Public Users
    console.log("👥 Checking existing Auth users and seeding defaults...");

    const existingAuthUsers = await db.select().from(authUsers);
    const existingEmails = new Set(existingAuthUsers.map((u) => u.email.toLowerCase()));

    // BCrypt hash for "password123"
    const dummyHash = "$2a$12$R.S91h/G1n/fA5J872o8M.OQy7m4oD14N5e0766hB6lR6o6r6r6r6";
    const defaultMockUsers = [
      {
        email: "admin@prestigebox.dev",
        firstName: "Alex",
        lastName: "Admin",
        role: "admin",
      },
      {
        email: "staff1@prestigebox.dev",
        firstName: "Sarah",
        lastName: "Staff",
        role: "staff",
      },
      {
        email: "staff2@prestigebox.dev",
        firstName: "Michael",
        lastName: "Manager",
        role: "staff",
      },
      {
        email: "client1@prestigebox.dev",
        firstName: "Chris",
        lastName: "Client",
        role: "client",
      },
      {
        email: "client2@prestigebox.dev",
        firstName: "Courtney",
        lastName: "Customer",
        role: "client",
      },
    ];

    // Insert default mock users if they don't already exist
    for (const u of defaultMockUsers) {
      if (!existingEmails.has(u.email.toLowerCase())) {
        const userId = faker.string.uuid();
        console.log(`Creating default mock user: ${u.email}`);

        await db.insert(authUsers).values({
          id: userId,
          email: u.email,
          encryptedPassword: dummyHash,
          emailConfirmedAt: new Date(),
          aud: "authenticated",
          role: "authenticated",
          rawAppMetaData: { provider: "email", providers: ["email"] },
          rawUserMetaData: {
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
          },
        });

        // The insert trigger handles public.users creation. Let's make sure photoURL is set.
        await db.update(users).set({ photoURL: faker.image.avatar() }).where(eq(users.uid, userId));
      }
    }

    // Retrieve the final consolidated list of all Auth users (default + existing developer users)
    const allAuthUsers = await db.select().from(authUsers);
    const allPublicUsers = await db.select().from(users);
    const publicUserMap = new Map(allPublicUsers.map((u) => [u.uid, u]));

    console.log(`Syncing ${allAuthUsers.length} total Auth users to public profiles...`);

    // Ensure every single Auth user has a corresponding record in public.users
    for (const authUser of allAuthUsers) {
      const publicUser = publicUserMap.get(authUser.id);
      const meta = (authUser.rawUserMetaData || {}) as Record<string, unknown>;
      const firstName = (meta.firstName as string | undefined) || authUser.email.split("@")[0] || "";
      const lastName = (meta.lastName as string | undefined) || "";
      const role = (meta.role as string | undefined) || "client";

      if (!publicUser) {
        // Manually create the public user profile if missing
        await db.insert(users).values({
          uid: authUser.id,
          email: authUser.email,
          firstName,
          lastName,
          role,
          photoURL: faker.image.avatar(),
        });
      } else {
        // Update the public profile if details are missing or empty
        const updates: Partial<typeof users.$inferInsert> = {};
        if (!publicUser.firstName && firstName) updates.firstName = firstName;
        if (!publicUser.lastName && lastName) updates.lastName = lastName;
        if (!publicUser.photoURL) updates.photoURL = faker.image.avatar();

        if (Object.keys(updates).length > 0) {
          await db.update(users).set(updates).where(eq(users.uid, authUser.id));
        }
      }
    }

    console.log("✨ User synchronization and seeding completed.");

    // 3. Seed Addresses
    console.log("📍 Seeding addresses...");
    const addressIds: string[] = [];
    const addressData: (typeof addresses.$inferInsert)[] = [];
    for (let i = 0; i < 30; i++) {
      const addressId = faker.string.uuid();
      addressIds.push(addressId);
      addressData.push({
        id: addressId,
        street1: faker.location.streetAddress(),
        street2: faker.helpers.maybe(() => faker.location.secondaryAddress(), { probability: 0.3 }) || null,
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode(),
        country: "USA",
      });
    }
    await db.insert(addresses).values(addressData);

    // 4. Seed People
    console.log("👤 Seeding people...");
    const peopleIds: string[] = [];
    const peopleData: (typeof people.$inferInsert)[] = [];
    for (let i = 0; i < 50; i++) {
      const pId = faker.string.uuid();
      peopleIds.push(pId);
      const fName = faker.person.firstName();
      const lName = faker.person.lastName();
      const mName = faker.person.middleName();

      // Assign 1 or 2 random addresses
      const randomAddresses = faker.helpers.arrayElements(addressData, faker.number.int({ min: 1, max: 2 }));
      const personAddressIds = randomAddresses.map((a) => a.id ?? "");
      const addressJSON = randomAddresses.map((a, idx) => ({
        id: a.id ?? "",
        type: idx === 0 ? "Home" : "Business",
        isPrimary: idx === 0,
      }));

      peopleData.push({
        id: pId,
        prefix: faker.helpers.maybe(() => faker.person.prefix(), { probability: 0.3 }) || null,
        firstName: fName,
        middleName: mName,
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
          {
            id: faker.string.uuid(),
            address: faker.internet.email({ firstName: fName, lastName: lName, provider: "work.com" }),
            type: "Work",
            isPrimary: false,
          },
        ],
        phones: [
          {
            id: faker.string.uuid(),
            number: faker.phone.number(),
            type: "Mobile",
            isPrimary: true,
          },
          {
            id: faker.string.uuid(),
            number: faker.phone.number(),
            type: "Home",
            isPrimary: false,
          },
        ],
        driversLicense: {
          number: faker.string.numeric(9),
          state: faker.location.state({ abbreviated: true }),
          expirationDate: faker.date.future({ years: 5 }).toISOString().split("T")[0],
        },
        pii: {
          ssn: faker.helpers.fromRegExp(/[0-9]{3}-[0-9]{2}-[0-9]{4}/),
          biologicalGender: faker.helpers.arrayElement(["Male", "Female"]),
          birthDate: faker.date.birthdate({ min: 18, max: 80, mode: "age" }).toISOString().split("T")[0],
        },
        addresses: addressJSON,
        addressIds: personAddressIds,
      });
    }
    await db.insert(people).values(peopleData);

    // 5. Seed Households
    console.log("🏠 Seeding households...");
    const householdData: (typeof households.$inferInsert)[] = [];
    for (let i = 0; i < 10; i++) {
      const randomAddressId = faker.helpers.arrayElement(addressIds);
      const randomPeopleIds = faker.helpers.arrayElements(peopleIds, faker.number.int({ min: 2, max: 5 }));
      const members = randomPeopleIds.map((pId, idx) => ({
        personId: pId,
        role: idx === 0 ? "home_owner" : "dependent",
      }));

      householdData.push({
        id: faker.string.uuid(),
        name: `${faker.person.lastName()} Household`,
        addressId: randomAddressId,
        memberIds: members,
      });
    }
    await db.insert(households).values(householdData);

    // 6. Seed Insurance Companies
    console.log("🏢 Seeding insurance companies...");
    const mockInsuranceCompanies = [
      { name: "Progressive", websiteUrl: "https://www.progressive.com" },
      { name: "State Farm", websiteUrl: "https://www.statefarm.com" },
      { name: "Allstate", websiteUrl: "https://www.allstate.com" },
      { name: "Geico", websiteUrl: "https://www.geico.com" },
      { name: "Liberty Mutual", websiteUrl: "https://www.libertymutual.com" },
      { name: "Nationwide", websiteUrl: "https://www.nationwide.com" },
      { name: "Travelers", websiteUrl: "https://www.travelers.com" },
      { name: "Chubb", websiteUrl: "https://www.chubb.com" },
    ];

    const insuranceCompanyIds: string[] = [];
    const insuranceCompanyData: (typeof insuranceCompanies.$inferInsert)[] = [];
    for (const company of mockInsuranceCompanies) {
      const insId = faker.string.uuid();
      insuranceCompanyIds.push(insId);
      insuranceCompanyData.push({
        id: insId,
        name: company.name,
        websiteUrl: company.websiteUrl,
        policyNames: [
          "Homeowners Insurance",
          "Auto Insurance",
          "Umbrella Policy",
          "Valuable Personal Property",
          "Flood Insurance",
        ],
      });
    }
    await db.insert(insuranceCompanies).values(insuranceCompanyData);

    // 7. Seed Clients
    console.log("💼 Seeding clients...");
    const clientIds: string[] = [];
    const clientData: (typeof clients.$inferInsert)[] = [];
    // Map the first 30 people to clients
    for (let i = 0; i < 30; i++) {
      const personId = peopleIds[i];

      const hobbiesList = faker.helpers.arrayElements(
        [
          "Golf",
          "Sailing",
          "Tennis",
          "Skiing",
          "Reading",
          "Traveling",
          "Gardening",
          "Wine Tasting",
          "Cooking",
          "Photography",
        ],
        faker.number.int({ min: 1, max: 4 }),
      );

      const sportsTeams = faker.helpers.arrayElements(
        [
          "New York Yankees",
          "Boston Red Sox",
          "Los Angeles Lakers",
          "Golden State Warriors",
          "New England Patriots",
          "Dallas Cowboys",
          "Manchester United",
          "Liverpool FC",
        ],
        faker.number.int({ min: 1, max: 3 }),
      );

      const paymentAccounts = [
        {
          id: faker.string.uuid(),
          bankName: `${faker.company.name()} Bank`,
          accountType: faker.helpers.arrayElement(["Checking", "Savings", "Investment"]),
          accountNumber: `****${faker.string.numeric(4)}`,
          routingNumber: faker.string.numeric(9),
        },
      ];

      // Select 2 random other people to be family members
      const potentialFamilyMembers = peopleIds.filter((p) => p !== personId);
      const randomFamilyPeople = faker.helpers.arrayElements(potentialFamilyMembers, 2);

      const familyMembers = [
        {
          id: faker.string.uuid(),
          personId: randomFamilyPeople[0],
          relationship: "Spouse" as const,
        },
        {
          id: faker.string.uuid(),
          personId: randomFamilyPeople[1],
          relationship: "Child" as const,
        },
      ];

      const employments = [
        {
          id: faker.string.uuid(),
          employerName: faker.company.name(),
          occupation: faker.person.jobTitle(),
          employerPhone: faker.phone.number(),
          startDate: faker.date.past({ years: 10 }).toISOString().split("T")[0],
        },
      ];

      const cId = faker.string.uuid();
      clientIds.push(cId);

      clientData.push({
        id: cId,
        personId: personId,
        hobbies: hobbiesList,
        favoriteSportsTeams: sportsTeams,
        paymentAccounts: paymentAccounts,
        familyMembers: familyMembers,
        employments: employments,
        pcDocuments: [{ name: "Homeowners Declarations", type: "PDF", uploadedAt: faker.date.past().toISOString() }],
        lifeDocuments: [{ name: "Term Life Policy Doc", type: "PDF", uploadedAt: faker.date.past().toISOString() }],
        estateDocuments: [{ name: "Last Will & Testament", type: "PDF", uploadedAt: faker.date.past().toISOString() }],
        liabilities: [
          {
            id: faker.string.uuid(),
            loanType: "Auto",
            creditorName: "Ally Auto",
            currentBalance: faker.number.int({ min: 15000, max: 50000 }),
          },
        ],
        mortgages: [
          {
            id: faker.string.uuid(),
            addressId: faker.helpers.arrayElement(peopleData[i].addressIds || []),
            purchasePrice: faker.number.int({ min: 250000, max: 750000 }),
            currentMarketValue: faker.number.int({ min: 300000, max: 800000 }),
          },
        ],
      });
    }
    await db.insert(clients).values(clientData);

    // 8. Seed Companies
    console.log("🏢 Seeding companies...");
    const companyData: (typeof companies.$inferInsert)[] = [];
    for (let i = 0; i < 10; i++) {
      const randomAddressId = faker.helpers.arrayElement(addressIds);
      const randomClients = faker.helpers.arrayElements(clientData, faker.number.int({ min: 1, max: 4 }));
      const companyClientIds = randomClients.map((c) => c.id ?? "");

      companyData.push({
        id: faker.string.uuid(),
        name: faker.company.name(),
        dba: `${faker.company.name()} DBA`,
        ein: faker.helpers.fromRegExp(/[0-9]{2}-[0-9]{7}/),
        addressId: randomAddressId,
        website: faker.internet.url(),
        phone: faker.phone.number(),
        clientIds: companyClientIds,
        situsRecords: [{ state: faker.location.state({ abbreviated: true }), description: "Primary operational site" }],
        nexusRecords: [{ state: faker.location.state({ abbreviated: true }), type: "Sales Tax Nexus" }],
      });
    }
    await db.insert(companies).values(companyData);

    // 9. Seed Client Policies
    console.log("📄 Seeding client policies...");
    const clientPolicyData: (typeof clientPolicies.$inferInsert)[] = [];
    for (let i = 0; i < 45; i++) {
      const client = faker.helpers.arrayElement(clientData);
      const insCompanyId = faker.helpers.arrayElement(insuranceCompanyIds);
      const insCompany = insuranceCompanyData.find((c) => c.id === insCompanyId);

      const policyName = faker.helpers.arrayElement(insCompany?.policyNames ?? []);
      const policyNumber = faker.helpers.fromRegExp(/POL[0-9]{10}/);
      const premiumAmount = faker.number.float({ min: 500, max: 8000, fractionDigits: 2 }).toString();

      const effectiveDate = faker.date.past({ years: 1 });
      const renewalDate = new Date(effectiveDate);
      renewalDate.setFullYear(effectiveDate.getFullYear() + 1);

      const accounts = (client.paymentAccounts ?? []) as unknown as PaymentAccount[];
      const paymentAccountId = accounts[0]?.id ?? faker.string.uuid();

      clientPolicyData.push({
        id: faker.string.uuid(),
        clientId: client.id ?? "",
        insuranceCompanyId: insCompanyId,
        paymentAccountId: paymentAccountId,
        policyName: policyName,
        policyNumber: policyNumber,
        premiumAmount: premiumAmount,
        effectiveDate: effectiveDate,
        renewalDate: renewalDate,
        paymentSchedule: faker.helpers.arrayElement(["Monthly", "Quarterly", "Semi-Annually", "Annually"]),
      });
    }
    await db.insert(clientPolicies).values(clientPolicyData);

    // 10. Seed Lawyers
    console.log("⚖️ Seeding lawyers...");
    const lawyerData: (typeof lawyers.$inferInsert)[] = [];
    // Map people index 30 to 34 to lawyers
    for (let i = 0; i < 5; i++) {
      const personId = peopleIds[30 + i];
      const randomAddressId = faker.helpers.arrayElement(addressIds);
      const randomClients = faker.helpers.arrayElements(clientData, faker.number.int({ min: 2, max: 6 }));
      const lawyerClientIds = randomClients.map((c) => c.id ?? "");

      lawyerData.push({
        id: faker.string.uuid(),
        personId: personId,
        firmName: `${faker.company.name()} LLP`,
        firmAddressId: randomAddressId,
        clientIds: lawyerClientIds,
      });
    }
    await db.insert(lawyers).values(lawyerData);

    // 11. Seed Accountants
    console.log("📊 Seeding accountants...");
    const accountantData: (typeof accountants.$inferInsert)[] = [];
    // Map people index 35 to 39 to accountants
    for (let i = 0; i < 5; i++) {
      const personId = peopleIds[35 + i];
      const randomAddressId = faker.helpers.arrayElement(addressIds);
      const randomClients = faker.helpers.arrayElements(clientData, faker.number.int({ min: 2, max: 6 }));
      const accountantClientIds = randomClients.map((c) => c.id ?? "");

      accountantData.push({
        id: faker.string.uuid(),
        personId: personId,
        firmName: `${faker.company.name()} CPAs`,
        firmAddressId: randomAddressId,
        clientIds: accountantClientIds,
      });
    }
    await db.insert(accountants).values(accountantData);

    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
