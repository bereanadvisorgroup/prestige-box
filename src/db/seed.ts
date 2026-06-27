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
  accountingFirms,
  actuarialFirms,
  addresses,
  assetHistory,
  assets,
  banks,
  clientPolicies,
  clients,
  companies,
  disabilityInsuranceCompanies,
  households,
  lawFirms,
  lifeInsuranceCompanies,
  longTermCareInsurance,
  moneyManagers,
  people,
  propertyAndCasualtyFirms,
  recordKeepers,
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
    await db.delete(lifeInsuranceCompanies);
    await db.delete(disabilityInsuranceCompanies);
    await db.delete(longTermCareInsurance);
    await db.delete(lawFirms);
    await db.delete(moneyManagers);
    await db.delete(recordKeepers);
    await db.delete(accountingFirms);
    await db.delete(actuarialFirms);
    await db.delete(banks);
    await db.delete(propertyAndCasualtyFirms);
    await db.delete(companies);
    await db.delete(assetHistory);
    await db.delete(assets);
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

    // 6. Seed Life Insurance Companies
    console.log("🏢 Seeding life insurance companies...");
    const mockLifeInsuranceCompanies = [
      { name: "Progressive", websiteUrl: "https://www.progressive.com" },
      { name: "State Farm", websiteUrl: "https://www.statefarm.com" },
      { name: "Allstate", websiteUrl: "https://www.allstate.com" },
      { name: "Geico", websiteUrl: "https://www.geico.com" },
      { name: "Liberty Mutual", websiteUrl: "https://www.libertymutual.com" },
      { name: "Nationwide", websiteUrl: "https://www.nationwide.com" },
      { name: "Travelers", websiteUrl: "https://www.travelers.com" },
      { name: "Chubb", websiteUrl: "https://www.chubb.com" },
    ];

    const lifeInsuranceCompanyIds: string[] = [];
    const lifeInsuranceCompanyData: (typeof lifeInsuranceCompanies.$inferInsert)[] = [];
    for (const company of mockLifeInsuranceCompanies) {
      const insId = faker.string.uuid();
      lifeInsuranceCompanyIds.push(insId);
      lifeInsuranceCompanyData.push({
        id: insId,
        name: company.name,
        websiteUrl: company.websiteUrl,
        policyNames: [
          "Term Life Insurance",
          "Whole Life Insurance",
          "Universal Life Insurance",
          "Variable Life Insurance",
          "Indexed Universal Life",
        ],
        phone: faker.phone.number(),
        personIds: faker.helpers.arrayElements(peopleIds, faker.number.int({ min: 1, max: 2 })),
      });
    }
    await db.insert(lifeInsuranceCompanies).values(lifeInsuranceCompanyData);

    // 6b. Seed Disability Insurance Companies
    console.log("🏢 Seeding disability insurance companies...");
    const mockDisabilityInsuranceCompanies = [
      { name: "Mutual of Omaha", websiteUrl: "https://www.mutualofomaha.com" },
      { name: "Guardian Life", websiteUrl: "https://www.guardianlife.com" },
      { name: "Unum", websiteUrl: "https://www.unum.com" },
      { name: "The Standard", websiteUrl: "https://www.standard.com" },
    ];

    const disabilityInsuranceCompanyIds: string[] = [];
    const disabilityInsuranceCompanyData: (typeof disabilityInsuranceCompanies.$inferInsert)[] = [];
    for (const company of mockDisabilityInsuranceCompanies) {
      const insId = faker.string.uuid();
      disabilityInsuranceCompanyIds.push(insId);
      disabilityInsuranceCompanyData.push({
        id: insId,
        name: company.name,
        websiteUrl: company.websiteUrl,
        policyNames: ["Short Term Disability", "Long Term Disability"],
        phone: faker.phone.number(),
        personIds: faker.helpers.arrayElements(peopleIds, faker.number.int({ min: 1, max: 2 })),
      });
    }
    await db.insert(disabilityInsuranceCompanies).values(disabilityInsuranceCompanyData);

    // 6c. Seed Long Term Care Insurance
    console.log("🏢 Seeding long term care insurance...");
    const mockLongTermCareInsurance = [
      { name: "John Hancock", websiteUrl: "https://www.johnhancock.com" },
      { name: "Mutual of Omaha", websiteUrl: "https://www.mutualofomaha.com" },
      { name: "Genworth Financial", websiteUrl: "https://www.genworth.com" },
      { name: "Transamerica", websiteUrl: "https://www.transamerica.com" },
    ];

    const longTermCareInsuranceIds: string[] = [];
    const longTermCareInsuranceData: (typeof longTermCareInsurance.$inferInsert)[] = [];
    for (const company of mockLongTermCareInsurance) {
      const insId = faker.string.uuid();
      longTermCareInsuranceIds.push(insId);
      longTermCareInsuranceData.push({
        id: insId,
        name: company.name,
        websiteUrl: company.websiteUrl,
        policyNames: ["Long Term Care"],
        phone: faker.phone.number(),
        personIds: faker.helpers.arrayElements(peopleIds, faker.number.int({ min: 1, max: 2 })),
      });
    }
    await db.insert(longTermCareInsurance).values(longTermCareInsuranceData);

    // 7. Seed Clients
    console.log("💼 Seeding clients...");
    const clientIds: string[] = [];
    const bankIds: string[] = [faker.string.uuid(), faker.string.uuid(), faker.string.uuid()];
    const assetData: (typeof assets.$inferInsert)[] = [];
    const assetHistoryData: (typeof assetHistory.$inferInsert)[] = [];
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

      const autoAssetId = faker.string.uuid();
      const currentAutoValue = faker.number.int({ min: 30000, max: 60000 });

      assetData.push({
        id: autoAssetId,
        clientId: cId,
        name: "2023 Tesla Model 3",
        category: "Real Estate and Fixed Physical Assets",
        subType: "Vehicles",
        currentValue: currentAutoValue.toString(),
        currency: "USD",
        isAutomated: false,
        institutionName: "Tesla",
      });

      assetHistoryData.push({
        id: faker.string.uuid(),
        assetId: autoAssetId,
        value: currentAutoValue.toString(),
        recordedAt: new Date(),
      });

      clientData.push({
        id: cId,
        personId: personId,
        hobbies: hobbiesList,
        favoriteSportsTeams: sportsTeams,
        paymentAccounts: paymentAccounts,
        familyMembers: familyMembers,
        employments: employments,
        pcDocuments: [
          {
            name: "Homeowners Declarations",
            url: faker.internet.url(),
            type: "PDF",
            uploadedAt: faker.date.past().toISOString(),
          },
        ],
        lifeDocuments: [
          {
            name: "Term Life Policy Doc",
            url: faker.internet.url(),
            type: "PDF",
            uploadedAt: faker.date.past().toISOString(),
          },
        ],
        ltcDocuments: [
          {
            name: "Long Term Care Policy Doc",
            url: faker.internet.url(),
            type: "PDF",
            uploadedAt: faker.date.past().toISOString(),
          },
        ],
        estateDocuments: [
          {
            name: "Last Will & Testament",
            url: faker.internet.url(),
            type: "PDF",
            uploadedAt: faker.date.past().toISOString(),
          },
        ],
        liabilities: [
          {
            id: faker.string.uuid(),
            loanType: "Auto",
            bankId: faker.helpers.arrayElement(bankIds),
            assetId: autoAssetId,
            currentBalance: faker.number.int({ min: 15000, max: 50000 }),
            monthlyPayment: faker.number.int({ min: 300, max: 900 }),
            startDate: faker.date.past({ years: 2 }).toISOString().split("T")[0],
            endDate: faker.date.future({ years: 3 }).toISOString().split("T")[0],
            statementPath: faker.internet.url(),
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

    if (assetData.length > 0) {
      await db.insert(assets).values(assetData);
      await db.insert(assetHistory).values(assetHistoryData);
    }

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
      const policyType = faker.helpers.arrayElement(["life", "disability", "long_term_care"]);

      const insCompanyId = policyType === "life" ? faker.helpers.arrayElement(lifeInsuranceCompanyIds) : null;
      const disabilityCompanyId =
        policyType === "disability" ? faker.helpers.arrayElement(disabilityInsuranceCompanyIds) : null;
      const longTermCareInsuranceId =
        policyType === "long_term_care" ? faker.helpers.arrayElement(longTermCareInsuranceIds) : null;

      const insCompany =
        policyType === "life"
          ? lifeInsuranceCompanyData.find((c) => c.id === insCompanyId)
          : policyType === "disability"
            ? disabilityInsuranceCompanyData.find((c) => c.id === disabilityCompanyId)
            : longTermCareInsuranceData.find((c) => c.id === longTermCareInsuranceId);

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
        lifeInsuranceCompanyId: insCompanyId,
        disabilityInsuranceCompanyId: disabilityCompanyId,
        longTermCareInsuranceId: longTermCareInsuranceId,
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

    // 10. Seed Law Firms
    console.log("⚖️ Seeding law firms...");
    const lawFirmData: (typeof lawFirms.$inferInsert)[] = [];
    // Map people index 30 to 34 to law firms
    for (let i = 0; i < 5; i++) {
      const personId = peopleIds[30 + i];
      const randomAddressId = faker.helpers.arrayElement(addressIds);
      const randomClients = faker.helpers.arrayElements(clientData, faker.number.int({ min: 2, max: 6 }));
      const lawFirmClientIds = randomClients.map((c) => c.id ?? "");

      const associatedPersonIds = [personId];
      if (i === 0) {
        associatedPersonIds.push(peopleIds[34]);
      }

      lawFirmData.push({
        id: faker.string.uuid(),
        personIds: associatedPersonIds,
        firmName: `${faker.company.name()} LLP`,
        firmAddressId: randomAddressId,
        website: faker.internet.url(),
        phone: faker.phone.number(),
        clientIds: lawFirmClientIds,
      });
    }
    await db.insert(lawFirms).values(lawFirmData);

    // 11. Seed Accounting Firms
    console.log("📊 Seeding accounting firms...");
    const accountingFirmData: (typeof accountingFirms.$inferInsert)[] = [];
    // Map people index 35 to 39 to accounting firms
    for (let i = 0; i < 5; i++) {
      const personId = peopleIds[35 + i];
      const randomAddressId = faker.helpers.arrayElement(addressIds);
      const randomClients = faker.helpers.arrayElements(clientData, faker.number.int({ min: 2, max: 6 }));
      const accountingFirmClientIds = randomClients.map((c) => c.id ?? "");

      const associatedPersonIds = [personId];
      if (i === 0) {
        associatedPersonIds.push(peopleIds[39]);
      }

      accountingFirmData.push({
        id: faker.string.uuid(),
        personIds: associatedPersonIds,
        firmName: `${faker.company.name()} CPAs`,
        firmAddressId: randomAddressId,
        website: faker.internet.url(),
        phone: faker.phone.number(),
        clientIds: accountingFirmClientIds,
      });
    }
    await db.insert(accountingFirms).values(accountingFirmData);

    // 12. Seed Actuarial Firms
    console.log("🧮 Seeding actuarial firms...");
    const actuarialFirmData: (typeof actuarialFirms.$inferInsert)[] = [];
    // Map people index 40 to 42 to actuarial firms
    for (let i = 0; i < 3; i++) {
      const personId = peopleIds[40 + i];
      const randomAddressId = faker.helpers.arrayElement(addressIds);
      const randomClients = faker.helpers.arrayElements(clientData, faker.number.int({ min: 2, max: 6 }));
      const actuarialFirmClientIds = randomClients.map((c) => c.id ?? "");

      const associatedPersonIds = [personId];
      if (i === 0) {
        associatedPersonIds.push(peopleIds[42]);
      }

      actuarialFirmData.push({
        id: faker.string.uuid(),
        personIds: associatedPersonIds,
        firmName: `${faker.company.name()} Actuarial`,
        firmAddressId: randomAddressId,
        website: faker.internet.url(),
        phone: faker.phone.number(),
        clientIds: actuarialFirmClientIds,
      });
    }
    await db.insert(actuarialFirms).values(actuarialFirmData);

    // 13. Seed Banks
    console.log("🏦 Seeding banks...");
    const bankData: (typeof banks.$inferInsert)[] = [];
    // Map people index 43 to 45 to banks
    for (let i = 0; i < 3; i++) {
      const personId = peopleIds[43 + i];
      const randomAddressId = faker.helpers.arrayElement(addressIds);
      const randomClients = faker.helpers.arrayElements(clientData, faker.number.int({ min: 2, max: 6 }));
      const bankClientIds = randomClients.map((c) => c.id ?? "");

      const associatedPersonIds = [personId];
      if (i === 0) {
        associatedPersonIds.push(peopleIds[45]);
      }

      bankData.push({
        id: bankIds[i],
        personIds: associatedPersonIds,
        firmName: `${faker.company.name()} Bank`,
        firmAddressId: randomAddressId,
        website: faker.internet.url(),
        phone: faker.phone.number(),
        clientIds: bankClientIds,
      });
    }
    await db.insert(banks).values(bankData);

    // 14. Seed Property and Casualty Firms
    console.log("🛡️ Seeding property and casualty firms...");
    const propertyAndCasualtyFirmData: (typeof propertyAndCasualtyFirms.$inferInsert)[] = [];
    // Map people index 46 to 49 to property and casualty firms
    for (let i = 0; i < 4; i++) {
      const personId = peopleIds[46 + i];
      const randomAddressId = faker.helpers.arrayElement(addressIds);
      const randomClients = faker.helpers.arrayElements(clientData, faker.number.int({ min: 2, max: 6 }));
      const propertyAndCasualtyFirmClientIds = randomClients.map((c) => c.id ?? "");

      const associatedPersonIds = [personId];
      if (i === 0) {
        associatedPersonIds.push(peopleIds[49]);
      }

      propertyAndCasualtyFirmData.push({
        id: faker.string.uuid(),
        personIds: associatedPersonIds,
        firmName: `${faker.company.name()} P&C`,
        firmAddressId: randomAddressId,
        website: faker.internet.url(),
        phone: faker.phone.number(),
        clientIds: propertyAndCasualtyFirmClientIds,
      });
    }
    await db.insert(propertyAndCasualtyFirms).values(propertyAndCasualtyFirmData);

    // 15. Seed Money Managers
    console.log("💼 Seeding money managers...");
    const moneyManagerData: (typeof moneyManagers.$inferInsert)[] = [];
    // Map people index 25 to 29 to money managers
    for (let i = 0; i < 5; i++) {
      const personId = peopleIds[25 + i];
      const randomAddressId = faker.helpers.arrayElement(addressIds);
      const randomClients = faker.helpers.arrayElements(clientData, faker.number.int({ min: 2, max: 6 }));
      const moneyManagerClientIds = randomClients.map((c) => c.id ?? "");

      const associatedPersonIds = [personId];
      if (i === 0) {
        associatedPersonIds.push(peopleIds[29]);
      }

      moneyManagerData.push({
        id: faker.string.uuid(),
        personIds: associatedPersonIds,
        firmName: `${faker.company.name()} Wealth`,
        firmAddressId: randomAddressId,
        website: faker.internet.url(),
        phone: faker.phone.number(),
        clientIds: moneyManagerClientIds,
      });
    }
    await db.insert(moneyManagers).values(moneyManagerData);

    // 16. Seed Record Keepers
    console.log("📂 Seeding record keepers...");
    const recordKeeperData: (typeof recordKeepers.$inferInsert)[] = [];
    // Map people index 20 to 24 to record keepers
    for (let i = 0; i < 5; i++) {
      const personId = peopleIds[20 + i];
      const randomAddressId = faker.helpers.arrayElement(addressIds);
      const randomClients = faker.helpers.arrayElements(clientData, faker.number.int({ min: 2, max: 6 }));
      const recordKeeperClientIds = randomClients.map((c) => c.id ?? "");

      const associatedPersonIds = [personId];
      if (i === 0) {
        associatedPersonIds.push(peopleIds[24]);
      }

      recordKeeperData.push({
        id: faker.string.uuid(),
        personIds: associatedPersonIds,
        firmName: `${faker.company.name()} Record Keeping`,
        firmAddressId: randomAddressId,
        website: faker.internet.url(),
        phone: faker.phone.number(),
        clientIds: recordKeeperClientIds,
      });
    }
    await db.insert(recordKeepers).values(recordKeeperData);

    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
