"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";
import { type Asset, type AssetHistory, AssetSchema } from "@/types/crm";

const ASSETS_TABLE = "assets";
const HISTORY_TABLE = "asset_history";

export async function getAssets(clientId: string) {
  try {
    const { data: assets, error } = await supabaseServer
      .from(ASSETS_TABLE)
      .select("*")
      .eq("clientId", clientId)
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return { success: true, assets: (assets || []) as Asset[] };
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
    // 1. Get all client assets
    const { data: clientAssets, error: assetsError } = await supabaseServer
      .from(ASSETS_TABLE)
      .select("id, name")
      .eq("clientId", clientId);

    if (assetsError) throw new Error(assetsError.message);
    if (!clientAssets || clientAssets.length === 0) return { success: true, historyData: [] };

    const assetIds = clientAssets.map((a) => a.id);

    // 2. Fetch history records for all these assets
    const { data: historyRecords, error: historyError } = await supabaseServer
      .from(HISTORY_TABLE)
      .select("*")
      .in("assetId", assetIds)
      .order("recordedAt", { ascending: true });

    if (historyError) throw new Error(historyError.message);
    if (!historyRecords || historyRecords.length === 0) return { success: true, historyData: [] };

    // 3. Build chronological net worth timeline
    const assetsMap = new Map<string, number>(); // assetId -> lastKnownValue
    const timelineMap = new Map<string, Record<string, number>>(); // dateStr -> { assetId: value }

    for (const record of historyRecords) {
      const dateStr = new Date(record.recordedAt).toISOString().split("T")[0];
      if (!timelineMap.has(dateStr)) {
        timelineMap.set(dateStr, {});
      }
      timelineMap.get(dateStr)![record.assetId] = Number(record.value);
    }

    const sortedDates = Array.from(timelineMap.keys()).sort();
    const historyData: { date: string; total: number; [key: string]: string | number }[] = [];

    const assetIdToName = clientAssets.reduce(
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
