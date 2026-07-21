import type { Client, Household, OwnershipSplit, OwnershipType } from "@/types/crm";

export interface AnyFinancialItem {
  id?: string;
  name?: string;
  title?: string;
  policyName?: string;
  accountNumber?: string;
  addressId?: string;
  currentValue?: number;
  value?: number;
  currentBalance?: number;
  purchasePrice?: number;
  currentMarketValue?: number;
  ownerIds?: string[];
  clientId?: string;
  personId?: string;
  ownershipType?: OwnershipType;
  ownershipSplits?: OwnershipSplit[];
  isLiability?: boolean;
  category?: string;
  subType?: string;
  loanType?: string;
}

export interface AllocatedFinancialItem {
  item: AnyFinancialItem;
  id: string;
  label: string;
  fullValue: number;
  allocatedValue: number;
  ownershipSharePercentage: number;
  isLiability: boolean;
}

export interface HouseholdFinancialSummary {
  householdId?: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  items: AllocatedFinancialItem[];
  memberRollupStatuses: Record<
    string,
    {
      clientId: string;
      includeInFinancialRollup: boolean;
      isPrimary: boolean;
      role: string;
    }
  >;
}

/**
 * Calculates aggregated balance sheet & net worth for a Household using Rules 1-4:
 * Rule 1: Member Eligibility (includeInFinancialRollup must be true for member in Household H)
 * Rule 2: Joint Ownership within same Household (sums co-owner shares to count asset ONCE (100%))
 * Rule 3: Partial Household Aggregation (allocates exact ownership split per household)
 * Rule 4: Multi-Household Exclusion (excludes assets for secondary households where includeInFinancialRollup = false)
 */
export function calculateHouseholdNetWorth(
  household: Household,
  clients: Client[] = [],
  assetsAndLiabilities: AnyFinancialItem[] = [],
): HouseholdFinancialSummary {
  // Map personId to clientId for resolution
  const personToClientMap: Record<string, string> = {};
  for (const client of clients) {
    if (client.id && client.personId) {
      personToClientMap[client.personId] = client.id;
    }
  }

  // Build lookup of household members
  const memberMap: Record<
    string,
    {
      clientId: string;
      includeInFinancialRollup: boolean;
      isPrimary: boolean;
      role: string;
    }
  > = {};

  for (const member of household.members || []) {
    const resolvedClientId = member.clientId || personToClientMap[member.clientId];
    if (resolvedClientId) {
      memberMap[resolvedClientId] = {
        clientId: resolvedClientId,
        includeInFinancialRollup: member.includeInFinancialRollup ?? true,
        isPrimary: member.isPrimaryHousehold ?? false,
        role: member.role,
      };
    }
  }

  // Collect items from direct list and embedded client items
  const allItems: AnyFinancialItem[] = [...assetsAndLiabilities];
  const seenIds = new Set<string>();

  for (const item of assetsAndLiabilities) {
    if (item.id) seenIds.add(item.id);
  }

  for (const client of clients) {
    if (!client.id) continue;

    // Liabilities
    for (const loan of client.liabilities || []) {
      const loanItem = loan as AnyFinancialItem;
      const itemId = loanItem.id || `loan-${client.id}-${loanItem.loanType}`;
      if (!seenIds.has(itemId)) {
        seenIds.add(itemId);
        allItems.push({
          ...loanItem,
          id: itemId,
          name: loanItem.name || `${loanItem.loanType || "Loan"} Liability`,
          isLiability: true,
          ownerIds: loanItem.ownerIds?.length ? loanItem.ownerIds : [client.id],
        });
      }
    }

    // Mortgages
    for (const mortgage of client.mortgages || []) {
      const mItem = mortgage as AnyFinancialItem;
      const itemId = mItem.id || `mortgage-${client.id}-${mItem.addressId}`;
      if (!seenIds.has(itemId)) {
        seenIds.add(itemId);
        allItems.push({
          ...mItem,
          id: itemId,
          name: mItem.name || "Mortgage Liability",
          isLiability: true,
          currentBalance: mItem.currentBalance ?? mItem.purchasePrice ?? 0,
          ownerIds: mItem.ownerIds?.length ? mItem.ownerIds : [client.id],
        });
      }
    }

    // Money Manager Accounts
    for (const mm of client.moneyManagerAccounts || []) {
      const mmItem = mm as AnyFinancialItem;
      const itemId = mmItem.id ? `mm-${mmItem.id}` : `mm-${client.id}-${mmItem.accountNumber}`;
      if (!seenIds.has(itemId)) {
        seenIds.add(itemId);
        allItems.push({
          ...mmItem,
          id: itemId,
          name: mmItem.title || mmItem.name || `Managed Account ${mmItem.accountNumber || ""}`,
          isLiability: false,
          currentValue: mmItem.value ?? mmItem.currentValue ?? 0,
          ownerIds: mmItem.ownerIds?.length ? mmItem.ownerIds : [client.id],
        });
      }
    }

    // Record Keeper Accounts
    for (const rk of client.recordKeeperAccounts || []) {
      const rkItem = rk as AnyFinancialItem;
      const itemId = rkItem.id ? `rk-${rkItem.id}` : `rk-${client.id}-${rkItem.accountNumber}`;
      if (!seenIds.has(itemId)) {
        seenIds.add(itemId);
        allItems.push({
          ...rkItem,
          id: itemId,
          name: rkItem.title || rkItem.name || `Record Keeper Account ${rkItem.accountNumber || ""}`,
          isLiability: false,
          currentValue: rkItem.value ?? rkItem.currentValue ?? 0,
          ownerIds: rkItem.ownerIds?.length ? rkItem.ownerIds : [client.id],
        });
      }
    }
  }

  let totalAssets = 0;
  let totalLiabilities = 0;
  const allocatedItems: AllocatedFinancialItem[] = [];

  for (const item of allItems) {
    // Resolve item owners
    let owners: string[] = [];
    if (item.ownerIds && item.ownerIds.length > 0) {
      owners = item.ownerIds.map((id) => personToClientMap[id] || id);
    } else if (item.clientId) {
      owners = [personToClientMap[item.clientId] || item.clientId];
    } else if (item.personId) {
      owners = [personToClientMap[item.personId] || item.personId];
    }

    if (owners.length === 0) continue;

    // Determine value and liability status
    const isLiability =
      item.isLiability === true ||
      typeof item.currentBalance === "number" ||
      item.category === "Liabilities" ||
      !!item.loanType;

    const fullValue = isLiability
      ? Number(item.currentBalance ?? item.value ?? item.currentValue ?? 0)
      : Number(item.currentValue ?? item.value ?? item.currentMarketValue ?? 0);

    if (isNaN(fullValue) || fullValue === 0) continue;

    // Determine owner splits
    let shareSum = 0;
    for (const ownerId of owners) {
      const member = memberMap[ownerId];
      // Rule 1: Must be household member AND includeInFinancialRollup must be true
      if (member && member.includeInFinancialRollup) {
        let ownerPercentage = 1 / owners.length;

        if (item.ownershipSplits && item.ownershipSplits.length > 0) {
          const split = item.ownershipSplits.find(
            (s) => s.clientId === ownerId || personToClientMap[s.clientId] === ownerId,
          );
          if (split) {
            ownerPercentage = split.percentage / 100;
          }
        }

        shareSum += ownerPercentage;
      }
    }

    if (shareSum > 0) {
      const allocatedValue = fullValue * shareSum;

      if (isLiability) {
        totalLiabilities += allocatedValue;
      } else {
        totalAssets += allocatedValue;
      }

      allocatedItems.push({
        item,
        id: item.id || `item-${Math.random()}`,
        label: item.name || item.title || item.policyName || "Financial Item",
        fullValue,
        allocatedValue,
        ownershipSharePercentage: Math.round(shareSum * 100 * 100) / 100,
        isLiability,
      });
    }
  }

  const netWorth = totalAssets - totalLiabilities;

  return {
    householdId: household.id,
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
    netWorth: Math.round(netWorth * 100) / 100,
    items: allocatedItems,
    memberRollupStatuses: memberMap,
  };
}
