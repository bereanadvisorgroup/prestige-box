import { formatPersonName } from "@/lib/utils";
import type { Client, Household, Person } from "@/types/crm";

import type { AnyFinancialItem } from "./financial-rollup";

export interface CategoryBreakdown {
  key: string;
  label: string;
  totalValue: number;
  items: { name: string; value: number }[];
}

export interface PortfolioData {
  id: string;
  title: string;
  subtitle?: string;
  ownerName: string;
  role: "HEAD" | "SPOUSE" | "JOINT" | "MEMBER";
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetCategories: CategoryBreakdown[];
  liabilityCategories: CategoryBreakdown[];
}

export interface HouseholdNetWorthOverviewData {
  asOfDate: string;
  portfolios: PortfolioData[];
  totalHouseholdAssets: number;
  totalHouseholdLiabilities: number;
  combinedNetWorth: number;
}

/**
 * Categorize asset into standard chart categories
 */
export function categorizeAsset(item: AnyFinancialItem): { key: string; label: string } {
  const cat = (item.category || "").toLowerCase();
  const sub = (item.subType || "").toLowerCase();
  const name = (item.name || item.title || "").toLowerCase();

  if (
    cat.includes("retirement") ||
    sub.includes("401k") ||
    sub.includes("ira") ||
    sub.includes("pension") ||
    name.includes("401k") ||
    name.includes("ira") ||
    name.includes("record keeper")
  ) {
    return { key: "retirement", label: "Retirement / 401k" };
  }

  if (
    cat.includes("real estate") ||
    sub.includes("residence") ||
    sub.includes("real estate") ||
    name.includes("home") ||
    name.includes("property") ||
    name.includes("residence")
  ) {
    return { key: "real_estate", label: "Real Estate" };
  }

  if (
    cat.includes("investment") ||
    cat.includes("business") ||
    cat.includes("managed") ||
    sub.includes("stock") ||
    sub.includes("bond") ||
    sub.includes("mutual") ||
    name.includes("money manager") ||
    name.includes("ownership")
  ) {
    return { key: "investments", label: "Investments" };
  }

  if (
    cat.includes("cash") ||
    cat.includes("savings") ||
    cat.includes("bank") ||
    sub.includes("checking") ||
    sub.includes("savings") ||
    name.includes("savings") ||
    name.includes("checking")
  ) {
    return { key: "cash_savings", label: "Cash Savings" };
  }

  return { key: "other_assets", label: "Other Assets" };
}

/**
 * Categorize liability into standard chart categories
 */
export function categorizeLiability(item: AnyFinancialItem): { key: string; label: string } {
  const cat = (item.category || "").toLowerCase();
  const loanType = (item.loanType || "").toLowerCase();
  const name = (item.name || item.title || "").toLowerCase();

  if (cat.includes("mortgage") || loanType.includes("mortgage") || name.includes("mortgage")) {
    return { key: "mortgage", label: "Mortgage" };
  }

  if (
    cat.includes("student") ||
    loanType.includes("student") ||
    name.includes("student") ||
    name.includes("education")
  ) {
    return { key: "student_loans", label: "Student Loans" };
  }

  if (
    cat.includes("credit") ||
    loanType.includes("credit") ||
    loanType.includes("personal") ||
    loanType.includes("auto") ||
    name.includes("credit card") ||
    name.includes("loan")
  ) {
    return { key: "credit_cards", label: "Credit Cards / Loans" };
  }

  return { key: "other_liabilities", label: "Other Liabilities" };
}

/**
 * Calculate Household Net Worth Overview structure grouped into:
 * - Head Portfolio ("MY PORTFOLIO")
 * - Joint Holdings ("JOINT HOLDINGS")
 * - Spouse Portfolio ("SPOUSE'S PORTFOLIO")
 * - Other Members Portfolios ("NAME'S PORTFOLIO")
 */
export function calculatePortfolioRollups(
  _household: Household,
  members: {
    person: Person | null;
    clientId: string;
    role: string;
    isPrimaryHousehold?: boolean;
    includeInFinancialRollup?: boolean;
  }[],
  clients: Client[],
  clientAssetsMap: Record<string, AnyFinancialItem[]>,
): HouseholdNetWorthOverviewData {
  // Filter members included in financial rollup
  const activeMembers = members.filter((m) => m.includeInFinancialRollup !== false);
  const activeClientIds = new Set(activeMembers.map((m) => m.clientId).filter(Boolean));

  // Map personId to clientId
  const personToClientMap: Record<string, string> = {};
  for (const client of clients) {
    if (client.id && client.personId) {
      personToClientMap[client.personId] = client.id;
    }
  }

  // Identify Head, Spouse, and Other Members
  let headMember = activeMembers.find((m) => m.role?.toUpperCase() === "HEAD" || m.role === "home_owner");
  if (!headMember && activeMembers.length > 0) {
    headMember = activeMembers[0];
  }

  const spouseMember = activeMembers.find(
    (m) => m !== headMember && (m.role?.toUpperCase() === "SPOUSE" || m.role?.toUpperCase() === "PARTNER"),
  );

  const otherMembers = activeMembers.filter((m) => m !== headMember && m !== spouseMember);

  // Helper to build member name
  const getMemberName = (m?: typeof headMember) => {
    if (!m?.person) return "Client";
    return formatPersonName(m.person, "Client");
  };

  // Collect all items across all active clients
  const allRawItems: AnyFinancialItem[] = [];
  const seenIds = new Set<string>();

  for (const client of clients) {
    if (!client.id || !activeClientIds.has(client.id)) continue;

    // Physical & Virtual Assets
    const cAssets = clientAssetsMap[client.id] || [];
    for (const ast of cAssets) {
      const astId = ast.id || `ast-${client.id}-${ast.name}`;
      if (!seenIds.has(astId)) {
        seenIds.add(astId);
        allRawItems.push({
          ...ast,
          id: astId,
          isLiability: false,
          ownerIds: ast.ownerIds?.length ? ast.ownerIds : [client.id],
        });
      }
    }

    // Liabilities (loans)
    for (const loan of client.liabilities || []) {
      const loanItem = loan as AnyFinancialItem;
      const loanId = loanItem.id || `loan-${client.id}-${loanItem.loanType || loanItem.name}`;
      if (!seenIds.has(loanId)) {
        seenIds.add(loanId);
        allRawItems.push({
          ...loanItem,
          id: loanId,
          name: loanItem.name || `${loanItem.loanType || "Loan"} Liability`,
          isLiability: true,
          ownerIds: loanItem.ownerIds?.length ? loanItem.ownerIds : [client.id],
        });
      }
    }

    // Mortgages
    for (const mortgage of client.mortgages || []) {
      const mItem = mortgage as AnyFinancialItem;
      const mId = mItem.id || `mortgage-${client.id}-${mItem.addressId || mItem.name}`;
      if (!seenIds.has(mId)) {
        seenIds.add(mId);
        allRawItems.push({
          ...mItem,
          id: mId,
          name: mItem.name || "Mortgage Liability",
          isLiability: true,
          currentBalance: mItem.currentBalance ?? mItem.purchasePrice ?? 0,
          ownerIds: mItem.ownerIds?.length ? mItem.ownerIds : [client.id],
        });
      }
    }
  }

  // Portfolio Bucket Holders
  interface TempBucket {
    id: string;
    title: string;
    subtitle?: string;
    ownerName: string;
    role: "HEAD" | "SPOUSE" | "JOINT" | "MEMBER";
    clientIds: Set<string>;
    items: AnyFinancialItem[];
  }

  const buckets: TempBucket[] = [];

  // Head Bucket
  if (headMember) {
    const headName = getMemberName(headMember);
    buckets.push({
      id: "head",
      title: "MY PORTFOLIO",
      subtitle: headName ? `(${headName})` : undefined,
      ownerName: headName,
      role: "HEAD",
      clientIds: new Set([headMember.clientId]),
      items: [],
    });
  }

  // Joint Holdings Bucket
  buckets.push({
    id: "joint",
    title: "JOINT HOLDINGS",
    subtitle: "(Shared Household)",
    ownerName: "Joint Household",
    role: "JOINT",
    clientIds: new Set(), // matched specially
    items: [],
  });

  // Spouse Bucket
  if (spouseMember) {
    const spouseName = getMemberName(spouseMember);
    buckets.push({
      id: "spouse",
      title: "SPOUSE'S PORTFOLIO",
      subtitle: spouseName ? `(${spouseName})` : undefined,
      ownerName: spouseName,
      role: "SPOUSE",
      clientIds: new Set([spouseMember.clientId]),
      items: [],
    });
  }

  // Other Members Buckets
  for (const m of otherMembers) {
    const mName = getMemberName(m);
    const firstName = m.person?.firstName?.toUpperCase() || "MEMBER";
    buckets.push({
      id: `member-${m.clientId}`,
      title: `${firstName}'S PORTFOLIO`,
      subtitle: mName ? `(${mName})` : undefined,
      ownerName: mName,
      role: "MEMBER",
      clientIds: new Set([m.clientId]),
      items: [],
    });
  }

  const headBucket = buckets.find((b) => b.role === "HEAD");
  const jointBucket = buckets.find((b) => b.role === "JOINT")!;

  // Categorize raw items into portfolio buckets
  for (const item of allRawItems) {
    // Resolve owner client IDs
    let owners: string[] = [];
    if (item.ownerIds && item.ownerIds.length > 0) {
      owners = item.ownerIds.map((id) => personToClientMap[id] || id);
    } else if (item.clientId) {
      owners = [personToClientMap[item.clientId] || item.clientId];
    } else if (item.personId) {
      owners = [personToClientMap[item.personId] || item.personId];
    }

    // Filter to active household members
    const householdOwners = owners.filter((id) => activeClientIds.has(id));

    if (householdOwners.length === 0) continue;

    // Check if Joint
    const isJoint = item.ownershipType === "JOINT_TENANTS" || householdOwners.length > 1;

    if (isJoint) {
      jointBucket.items.push(item);
    } else {
      const ownerId = householdOwners[0];
      const targetBucket = buckets.find((b) => b.role !== "JOINT" && b.clientIds.has(ownerId));
      if (targetBucket) {
        targetBucket.items.push(item);
      } else if (headBucket) {
        headBucket.items.push(item);
      } else {
        jointBucket.items.push(item);
      }
    }
  }

  // Format final PortfolioData array
  let totalHouseholdAssets = 0;
  let totalHouseholdLiabilities = 0;

  const portfolios: PortfolioData[] = buckets.map((bucket) => {
    let totalAssets = 0;
    let totalLiabilities = 0;

    const assetCatMap = new Map<string, CategoryBreakdown>();
    const liabilityCatMap = new Map<string, CategoryBreakdown>();

    for (const item of bucket.items) {
      const isLiability =
        item.isLiability === true ||
        typeof item.currentBalance === "number" ||
        item.category === "Liabilities" ||
        !!item.loanType;

      const value = isLiability
        ? Number(item.currentBalance ?? item.value ?? item.currentValue ?? 0)
        : Number(item.currentValue ?? item.value ?? item.currentMarketValue ?? 0);

      if (Number.isNaN(value) || value <= 0) continue;

      const label = item.name || item.title || item.policyName || "Financial Item";

      if (isLiability) {
        totalLiabilities += value;
        const cat = categorizeLiability(item);
        if (!liabilityCatMap.has(cat.key)) {
          liabilityCatMap.set(cat.key, {
            key: cat.key,
            label: cat.label,
            totalValue: 0,
            items: [],
          });
        }
        const existing = liabilityCatMap.get(cat.key)!;
        existing.totalValue += value;
        existing.items.push({ name: label, value });
      } else {
        totalAssets += value;
        const cat = categorizeAsset(item);
        if (!assetCatMap.has(cat.key)) {
          assetCatMap.set(cat.key, {
            key: cat.key,
            label: cat.label,
            totalValue: 0,
            items: [],
          });
        }
        const existing = assetCatMap.get(cat.key)!;
        existing.totalValue += value;
        existing.items.push({ name: label, value });
      }
    }

    totalHouseholdAssets += totalAssets;
    totalHouseholdLiabilities += totalLiabilities;

    return {
      id: bucket.id,
      title: bucket.title,
      subtitle: bucket.subtitle,
      ownerName: bucket.ownerName,
      role: bucket.role,
      totalAssets: Math.round(totalAssets),
      totalLiabilities: Math.round(totalLiabilities),
      netWorth: Math.round(totalAssets - totalLiabilities),
      assetCategories: Array.from(assetCatMap.values()),
      liabilityCategories: Array.from(liabilityCatMap.values()),
    };
  });

  // Current month as of date, e.g. OCT 2023 or current date format
  const dateNow = new Date();
  const monthStr = dateNow.toLocaleString("default", { month: "short" }).toUpperCase();
  const yearStr = dateNow.getFullYear();
  const asOfDate = `AS OF ${monthStr} ${yearStr}`;

  return {
    asOfDate,
    portfolios,
    totalHouseholdAssets: Math.round(totalHouseholdAssets),
    totalHouseholdLiabilities: Math.round(totalHouseholdLiabilities),
    combinedNetWorth: Math.round(totalHouseholdAssets - totalHouseholdLiabilities),
  };
}
