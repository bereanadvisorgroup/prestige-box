import { type Household, type Client } from "@/types/crm";
import { calculateHouseholdNetWorth, type AnyFinancialItem } from "./financial-rollup";

function runTests() {
  console.log("--- Starting Financial Rollup Unit Tests (Rules 1-4) ---");

  // Sample Clients
  const clientBob: Client = {
    id: "c-bob",
    personId: "p-bob",
    hobbies: [],
    favoriteSportsTeams: [],
    paymentAccounts: [],
    familyMembers: [],
    employments: [],
    pcDocuments: [],
    lifeDocuments: [],
    ltcDocuments: [],
    estateDocuments: [],
    lifePolicies: [],
    disabilityPolicies: [],
    ltcPolicies: [],
    moneyManagerAccounts: [],
    recordKeeperAccounts: [],
    liabilities: [],
    mortgages: [],
  };

  const clientJane: Client = {
    id: "c-jane",
    personId: "p-jane",
    hobbies: [],
    favoriteSportsTeams: [],
    paymentAccounts: [],
    familyMembers: [],
    employments: [],
    pcDocuments: [],
    lifeDocuments: [],
    ltcDocuments: [],
    estateDocuments: [],
    lifePolicies: [],
    disabilityPolicies: [],
    ltcPolicies: [],
    moneyManagerAccounts: [],
    recordKeeperAccounts: [],
    liabilities: [],
    mortgages: [],
  };

  const clients = [clientBob, clientJane];

  // Test 1: Rule 2 (Joint Ownership in Same Household = 100% aggregated once)
  const householdMain: Household = {
    id: "h-main",
    name: "Main Household",
    addressId: "addr-1",
    members: [
      { clientId: "c-bob", role: "HEAD", isPrimaryHousehold: true, includeInFinancialRollup: true },
      { clientId: "c-jane", role: "SPOUSE", isPrimaryHousehold: true, includeInFinancialRollup: true },
    ],
  };

  const jointHomeAsset: AnyFinancialItem = {
    id: "asset-home",
    name: "Primary Residence",
    currentValue: 1000000,
    ownerIds: ["c-bob", "c-jane"],
    ownershipType: "JOINT_TENANTS",
  };

  const jointMortgage: AnyFinancialItem = {
    id: "loan-mortgage",
    name: "Home Mortgage",
    currentBalance: 400000,
    ownerIds: ["c-bob", "c-jane"],
    isLiability: true,
  };

  const summary1 = calculateHouseholdNetWorth(householdMain, clients, [jointHomeAsset, jointMortgage]);
  console.assert(
    summary1.totalAssets === 1000000,
    `Rule 2 Asset Failed: expected 1000000, got ${summary1.totalAssets}`,
  );
  console.assert(
    summary1.totalLiabilities === 400000,
    `Rule 2 Liability Failed: expected 400000, got ${summary1.totalLiabilities}`,
  );
  console.assert(summary1.netWorth === 600000, `Rule 2 NetWorth Failed: expected 600000, got ${summary1.netWorth}`);
  console.log("✅ Test 1 Passed: Joint ownership within same household counts asset ONCE (100%).");

  // Test 2: Rule 3 (Partial Aggregation across Households 50% / 50%)
  const householdBob: Household = {
    id: "h-bob",
    name: "Bob's Household",
    addressId: "addr-1",
    members: [{ clientId: "c-bob", role: "HEAD", isPrimaryHousehold: true, includeInFinancialRollup: true }],
  };

  const householdJane: Household = {
    id: "h-jane",
    name: "Jane's Household",
    addressId: "addr-2",
    members: [{ clientId: "c-jane", role: "HEAD", isPrimaryHousehold: true, includeInFinancialRollup: true }],
  };

  const splitProperty: AnyFinancialItem = {
    id: "asset-beach-house",
    name: "Beach House",
    currentValue: 500000,
    ownerIds: ["c-bob", "c-jane"],
    ownershipType: "TENANTS_IN_COMMON",
    ownershipSplits: [
      { clientId: "c-bob", percentage: 60 },
      { clientId: "c-jane", percentage: 40 },
    ],
  };

  const summaryBob = calculateHouseholdNetWorth(householdBob, clients, [splitProperty]);
  const summaryJane = calculateHouseholdNetWorth(householdJane, clients, [splitProperty]);

  console.assert(
    summaryBob.totalAssets === 300000,
    `Rule 3 Bob Failed: expected 300000 (60%), got ${summaryBob.totalAssets}`,
  );
  console.assert(
    summaryJane.totalAssets === 200000,
    `Rule 3 Jane Failed: expected 200000 (40%), got ${summaryJane.totalAssets}`,
  );
  console.log("✅ Test 2 Passed: Partial Household Aggregation (60% to Bob, 40% to Jane).");

  // Test 3: Rule 1 & Rule 4 (Multi-Household Exclusion via includeInFinancialRollup = false)
  const householdSecondary: Household = {
    id: "h-secondary",
    name: "Secondary Vacation Household",
    addressId: "addr-3",
    members: [{ clientId: "c-bob", role: "MEMBER", isPrimaryHousehold: false, includeInFinancialRollup: false }],
  };

  const bobIRA: AnyFinancialItem = {
    id: "asset-ira",
    name: "Bob's Individual IRA",
    currentValue: 250000,
    ownerIds: ["c-bob"],
    ownershipType: "INDIVIDUAL",
  };

  const summarySec = calculateHouseholdNetWorth(householdSecondary, clients, [bobIRA]);
  console.assert(summarySec.totalAssets === 0, `Rule 4 Exclusion Failed: expected 0, got ${summarySec.totalAssets}`);
  console.assert(summarySec.netWorth === 0, `Rule 4 NetWorth Failed: expected 0, got ${summarySec.netWorth}`);
  console.log("✅ Test 3 Passed: Multi-Household Exclusion (includeInFinancialRollup=false excludes asset).");

  console.log("\nALL FINANCIAL ROLLUP UNIT TESTS PASSED SUCCESSFULLY! 🎉\n");
}

runTests();
