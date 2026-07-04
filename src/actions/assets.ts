"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";
import { type Asset, type AssetHistory, AssetSchema } from "@/types/crm";

const ASSETS_TABLE = "assets";
const HISTORY_TABLE = "asset_history";

export async function getAssets(clientId: string) {
  try {
    // 1. Fetch physical assets
    const { data: dbAssets, error: assetsError } = await supabaseServer
      .from(ASSETS_TABLE)
      .select("*")
      .eq("clientId", clientId)
      .order("createdAt", { ascending: false });

    if (assetsError) throw new Error(assetsError.message);

    // 2. Fetch client personId, liabilities, and managed accounts
    const { data: client, error: clientError } = await supabaseServer
      .from("clients")
      .select("personId, liabilities, moneyManagerAccounts")
      .eq("id", clientId)
      .single();

    if (clientError) throw new Error(clientError.message);

    // 3. Mark links on physical assets
    const liabilities = (client?.liabilities || []) as any[];
    const mappedAssets = (dbAssets || []).map((asset) => {
      const isLinked = liabilities.some((loan) => loan.assetId === asset.id);
      return {
        ...asset,
        currentValue: Number(asset.currentValue),
        isLinked,
      } as Asset;
    });

    const virtualAssets: Asset[] = [];

    // 3b. Surface money manager accounts as virtual assets so their value rolls into net worth.
    const managedAccounts = (client?.moneyManagerAccounts || []) as any[];
    if (managedAccounts.length > 0) {
      const managerIds = Array.from(new Set(managedAccounts.map((a) => a.moneyManagerId).filter(Boolean)));
      const managerNames: Record<string, string> = {};
      if (managerIds.length > 0) {
        const { data: managers } = await supabaseServer
          .from("money_managers")
          .select("id, firmName")
          .in("id", managerIds);
        for (const m of managers || []) managerNames[m.id] = m.firmName;
      }

      for (const account of managedAccounts) {
        const managerName = managerNames[account.moneyManagerId] || "Money Manager";
        const label = account.title || account.accountNumber || managerName;
        virtualAssets.push({
          id: `mm-${account.id}`,
          clientId,
          name: `${label} (${managerName})`,
          category: "Managed Accounts",
          subType: "Managed Account",
          currentValue: Number(account.value) || 0,
          currency: "USD",
          isAutomated: false,
          institutionName: managerName,
          addressId: null,
          isManagedAccount: true, // managed from the client's Money Managers page; read-only here
          isLinked: true,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        } as Asset);
      }
    }

    // 4. Fetch company ownership assets if personId exists
    if (client?.personId) {
      const { data: ownerships, error: ownershipsError } = await supabaseServer
        .from("company_owners")
        .select(`
          id,
          companyId,
          ownershipPercentage,
          createdAt,
          updatedAt,
          company:companies (
            id,
            name,
            estimatedValue,
            addressId,
            createdAt,
            updatedAt
          )
        `)
        .eq("personId", client.personId);

      if (ownershipsError) {
        console.error("[getAssets] Error fetching company ownerships:", ownershipsError);
      } else if (ownerships) {
        for (const ownership of ownerships) {
          const companyData = (ownership as any).company;
          const company = Array.isArray(companyData) ? companyData[0] : companyData;
          if (company) {
            const ownershipPercentage = Number(ownership.ownershipPercentage);
            const estimatedValue = Number(company.estimatedValue);
            const currentValue = (estimatedValue * ownershipPercentage) / 100;

            virtualAssets.push({
              id: `company-${company.id}`,
              clientId,
              name: `${company.name} Ownership (${ownershipPercentage}%)`,
              category: "Business Ownership",
              subType: "Business Ownership",
              currentValue,
              currency: "USD",
              isAutomated: true,
              institutionName: company.name,
              addressId: company.addressId || null,
              isCompanyAsset: true,
              companyId: company.id,
              isLinked: true, // Mark as linked so delete/edit action is disabled
              createdAt: (ownership as any).createdAt,
              updatedAt: (ownership as any).updatedAt,
            });
          }
        }
      }
    }

    return { success: true, assets: [...mappedAssets, ...virtualAssets] };
  } catch (error) {
    console.error("[getAssets] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function createAsset(data: Omit<Asset, "id" | "createdAt" | "updatedAt">) {
  try {
    const validated = AssetSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 1. Insert asset
    const { data: inserted, error: insertError } = await supabaseServer
      .from(ASSETS_TABLE)
      .insert(validated)
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);
    if (!inserted) throw new Error("Failed to insert asset");

    // 2. Insert initial snapshot into asset_history
    const initialSnapshot = {
      assetId: inserted.id,
      value: validated.currentValue,
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const { error: historyError } = await supabaseServer.from(HISTORY_TABLE).insert(initialSnapshot);

    if (historyError) {
      console.error("[createAsset] Warning: Failed to insert initial value history:", historyError.message);
    }

    revalidatePath(`/dashboard/crm/clients/${data.clientId}/assets`);
    return { success: true, asset: inserted as Asset };
  } catch (error) {
    console.error("[createAsset] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateAsset(id: string, data: Partial<Asset>) {
  try {
    const { data: currentAsset, error: fetchError } = await supabaseServer
      .from(ASSETS_TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw new Error(fetchError.message);
    if (!currentAsset) throw new Error("Asset not found");

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Update asset
    const { error: updateError } = await supabaseServer.from(ASSETS_TABLE).update(updateData).eq("id", id);

    if (updateError) throw new Error(updateError.message);

    // If the value changed, append to history!
    if (data.currentValue !== undefined && data.currentValue !== Number(currentAsset.currentValue)) {
      const snapshot = {
        assetId: id,
        value: data.currentValue,
        recordedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      await supabaseServer.from(HISTORY_TABLE).insert(snapshot);
    }

    revalidatePath(`/dashboard/crm/clients/${currentAsset.clientId}/assets`);
    return { success: true };
  } catch (error) {
    console.error("[updateAsset] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteAsset(id: string) {
  try {
    // Get clientId for cache revalidation before deletion
    const { data: currentAsset, error: fetchError } = await supabaseServer
      .from(ASSETS_TABLE)
      .select("clientId")
      .eq("id", id)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    // Delete asset history explicitly
    const { error: deleteHistoryError } = await supabaseServer.from(HISTORY_TABLE).delete().eq("assetId", id);

    if (deleteHistoryError) {
      console.warn("[deleteAsset] Warning: Failed to delete history records:", deleteHistoryError.message);
    }

    const { error: deleteError } = await supabaseServer.from(ASSETS_TABLE).delete().eq("id", id);

    if (deleteError) throw new Error(deleteError.message);

    revalidatePath(`/dashboard/crm/clients/${currentAsset.clientId}/assets`);
    return { success: true };
  } catch (error) {
    console.error("[deleteAsset] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getAssetHistory(assetId: string) {
  try {
    const { data: history, error } = await supabaseServer
      .from(HISTORY_TABLE)
      .select("*")
      .eq("assetId", assetId)
      .order("recordedAt", { ascending: true });

    if (error) throw new Error(error.message);
    return { success: true, history: (history || []) as AssetHistory[] };
  } catch (error) {
    console.error("[getAssetHistory] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function addAssetHistorySnapshot(assetId: string, value: number, recordedAt?: string) {
  try {
    const { data: currentAsset, error: fetchError } = await supabaseServer
      .from(ASSETS_TABLE)
      .select("clientId")
      .eq("id", assetId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const snapshot = {
      assetId,
      value,
      recordedAt: recordedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const { error: insertError } = await supabaseServer.from(HISTORY_TABLE).insert(snapshot);

    if (insertError) throw new Error(insertError.message);

    // Also update current value of the asset to reflect the latest snapshot if the snapshot date is latest
    await supabaseServer
      .from(ASSETS_TABLE)
      .update({ currentValue: value, updatedAt: new Date().toISOString() })
      .eq("id", assetId);

    revalidatePath(`/dashboard/crm/clients/${currentAsset.clientId}/assets`);
    return { success: true };
  } catch (error) {
    console.error("[addAssetHistorySnapshot] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteAssetHistorySnapshot(id: string) {
  try {
    // Get assetId to revalidate
    const { data: snapshot, error: fetchError } = await supabaseServer
      .from(HISTORY_TABLE)
      .select("assetId")
      .eq("id", id)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const { data: currentAsset, error: fetchAssetError } = await supabaseServer
      .from(ASSETS_TABLE)
      .select("clientId")
      .eq("id", snapshot.assetId)
      .single();

    if (fetchAssetError) throw new Error(fetchAssetError.message);

    const { error: deleteError } = await supabaseServer.from(HISTORY_TABLE).delete().eq("id", id);

    if (deleteError) throw new Error(deleteError.message);

    // Get the new latest snapshot to update currentValue in assets table
    const { data: latestHistory, error: latestError } = await supabaseServer
      .from(HISTORY_TABLE)
      .select("value")
      .eq("assetId", snapshot.assetId)
      .order("recordedAt", { ascending: false })
      .limit(1);

    if (!latestError && latestHistory && latestHistory.length > 0) {
      await supabaseServer
        .from(ASSETS_TABLE)
        .update({ currentValue: latestHistory[0].value, updatedAt: new Date().toISOString() })
        .eq("id", snapshot.assetId);
    }

    revalidatePath(`/dashboard/crm/clients/${currentAsset.clientId}/assets`);
    return { success: true };
  } catch (error) {
    console.error("[deleteAssetHistorySnapshot] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getClientAssetHistory(clientId: string) {
  try {
    // 1. Get all client physical assets
    const { data: clientAssets, error: assetsError } = await supabaseServer
      .from(ASSETS_TABLE)
      .select("id, name")
      .eq("clientId", clientId);

    if (assetsError) throw new Error(assetsError.message);

    // 2. Fetch client personId and managed accounts
    const { data: client, error: clientError } = await supabaseServer
      .from("clients")
      .select("personId, moneyManagerAccounts")
      .eq("id", clientId)
      .single();

    if (clientError) throw new Error(clientError.message);

    const assetIds = (clientAssets || []).map((a) => a.id);
    const virtualAssets: { id: string; name: string; ownershipPercentage?: number }[] = [];
    const virtualHistoryRecords: any[] = [];

    // 2b. Money manager accounts: one snapshot per account (at its management begin date) so
    // the account value is reflected in the net worth timeline.
    const managedAccounts = (client?.moneyManagerAccounts || []) as any[];
    if (managedAccounts.length > 0) {
      const managerIds = Array.from(new Set(managedAccounts.map((a) => a.moneyManagerId).filter(Boolean)));
      const managerNames: Record<string, string> = {};
      if (managerIds.length > 0) {
        const { data: managers } = await supabaseServer
          .from("money_managers")
          .select("id, firmName")
          .in("id", managerIds);
        for (const m of managers || []) managerNames[m.id] = m.firmName;
      }

      for (const account of managedAccounts) {
        const managerName = managerNames[account.moneyManagerId] || "Money Manager";
        const label = account.title || account.accountNumber || managerName;
        const recordedAt = account.managementBeginDate || account.createdAt || new Date(0).toISOString();
        virtualAssets.push({ id: `mm-${account.id}`, name: `${label} (${managerName})` });
        virtualHistoryRecords.push({
          id: `mm-hist-${account.id}`,
          assetId: `mm-${account.id}`,
          value: Number(account.value) || 0,
          recordedAt: new Date(recordedAt).toISOString(),
          createdAt: account.createdAt || recordedAt,
        });
      }
    }

    // 3. Fetch company ownerships and their valuation histories if personId exists
    if (client?.personId) {
      const { data: ownerships, error: ownershipsError } = await supabaseServer
        .from("company_owners")
        .select(`
          companyId,
          ownershipPercentage,
          company:companies (
            name
          )
        `)
        .eq("personId", client.personId);

      if (ownershipsError) {
        console.error("[getClientAssetHistory] Error fetching ownerships:", ownershipsError);
      } else if (ownerships && ownerships.length > 0) {
        const companyIds = ownerships.map((o) => o.companyId);

        for (const o of ownerships) {
          const companyData = (o as any).company;
          const company = Array.isArray(companyData) ? companyData[0] : companyData;
          if (company) {
            virtualAssets.push({
              id: `company-${o.companyId}`,
              name: `${company.name} Ownership (${o.ownershipPercentage}%)`,
              ownershipPercentage: Number(o.ownershipPercentage),
            });
          }
        }

        // Fetch history records for all these companies
        const { data: compHistory, error: compHistoryError } = await supabaseServer
          .from("company_valuation_history")
          .select("*")
          .in("companyId", companyIds)
          .order("valuationDate", { ascending: true });

        if (compHistoryError) {
          console.error("[getClientAssetHistory] Error fetching company valuation history:", compHistoryError);
        } else if (compHistory) {
          for (const record of compHistory) {
            const ownership = ownerships.find((o) => o.companyId === record.companyId);
            if (ownership) {
              const ownershipPercentage = Number(ownership.ownershipPercentage);
              const scaledValue = (Number(record.value) * ownershipPercentage) / 100;
              virtualHistoryRecords.push({
                id: `company-hist-${record.id}`,
                assetId: `company-${record.companyId}`,
                value: scaledValue,
                recordedAt: record.valuationDate,
                createdAt: record.createdAt,
              });
            }
          }
        }
      }
    }

    // 4. Fetch history records for all physical assets
    let historyRecords: any[] = [];
    if (assetIds.length > 0) {
      const { data: dbHistory, error: historyError } = await supabaseServer
        .from(HISTORY_TABLE)
        .select("*")
        .in("assetId", assetIds)
        .order("recordedAt", { ascending: true });

      if (historyError) throw new Error(historyError.message);
      historyRecords = dbHistory || [];
    }

    // Combine all history records and all assets
    const allHistoryRecords = [...historyRecords, ...virtualHistoryRecords];
    if (allHistoryRecords.length === 0) return { success: true, historyData: [] };

    // Build chronological net worth timeline
    const assetsMap = new Map<string, number>(); // assetId -> lastKnownValue
    const timelineMap = new Map<string, Record<string, number>>(); // dateStr -> { assetId: value }

    for (const record of allHistoryRecords) {
      const dateStr = new Date(record.recordedAt).toISOString().split("T")[0];
      if (!timelineMap.has(dateStr)) {
        timelineMap.set(dateStr, {});
      }
      timelineMap.get(dateStr)![record.assetId] = Number(record.value);
    }

    const sortedDates = Array.from(timelineMap.keys()).sort();
    const historyData: { date: string; total: number; [key: string]: string | number }[] = [];

    const allAssets = [...(clientAssets || []), ...virtualAssets];
    const assetIdToName = allAssets.reduce(
      (acc, a) => {
        acc[a.id] = a.name;
        return acc;
      },
      {} as Record<string, string>,
    );

    for (const date of sortedDates) {
      const dayValues = timelineMap.get(date)!;
      for (const [aId, val] of Object.entries(dayValues)) {
        assetsMap.set(aId, val);
      }

      let total = 0;
      const details: Record<string, number> = {};
      for (const [aId, val] of assetsMap.entries()) {
        total += val;
        const name = assetIdToName[aId] || "Unknown Asset";
        details[name] = val;
      }

      historyData.push({
        date,
        total,
        ...details,
      });
    }

    return { success: true, historyData };
  } catch (error) {
    console.error("[getClientAssetHistory] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
