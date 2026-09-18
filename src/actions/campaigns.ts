"use server";

import { revalidatePath } from "next/cache";

import { fetchAllRows } from "@/lib/fetch-chunks";
import { supabaseServer } from "@/lib/supabase.server";
import {
  type Campaign,
  CampaignSchema,
  type EnrichedCampaign,
  type ProspectCampaignAttribution,
  ProspectCampaignAttributionSchema,
} from "@/types/prospects";

const CAMPAIGNS_TABLE = "campaigns";
const PROSPECTS_TABLE = "prospects";
const ATTRIBUTIONS_TABLE = "prospect_campaign_attributions";

export async function getCampaigns(): Promise<{
  success: boolean;
  campaigns?: EnrichedCampaign[];
  error?: string;
}> {
  try {
    const rawCampaigns = await fetchAllRows((from, to) =>
      supabaseServer.from(CAMPAIGNS_TABLE).select("*").order("name", { ascending: true }).range(from, to),
    );

    if (!rawCampaigns || rawCampaigns.length === 0) {
      return { success: true, campaigns: [] };
    }

    // Fetch all prospects to compute attribution metrics
    const prospects = await fetchAllRows((from, to) =>
      supabaseServer.from(PROSPECTS_TABLE).select("id, primaryCampaignId, convertedClientId").range(from, to),
    );

    const enriched: EnrichedCampaign[] = rawCampaigns.map((c) => {
      const matchedProspects = (prospects || []).filter((p) => p.primaryCampaignId === c.id);
      const prospectsCount = matchedProspects.length;
      const conversionsCount = matchedProspects.filter((p) => !!p.convertedClientId).length;
      const budgetNum = Number(c.budget) || 0;
      const costPerProspect = prospectsCount > 0 ? Number((budgetNum / prospectsCount).toFixed(2)) : 0;
      const conversionRate = prospectsCount > 0 ? Number(((conversionsCount / prospectsCount) * 100).toFixed(1)) : 0;

      return {
        ...c,
        budget: budgetNum,
        prospectsCount,
        conversionsCount,
        costPerProspect,
        conversionRate,
      };
    });

    return { success: true, campaigns: enriched };
  } catch (error) {
    console.error("[getCampaigns] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getCampaign(id: string) {
  try {
    const { data: campaign, error } = await supabaseServer.from(CAMPAIGNS_TABLE).select("*").eq("id", id).single();

    if (error) throw new Error(error.message);
    if (!campaign) return { success: false, error: "Campaign not found" };

    // Fetch prospects linked directly or via attribution
    const { data: directProspects } = await supabaseServer
      .from(PROSPECTS_TABLE)
      .select("*")
      .eq("primaryCampaignId", id);

    const { data: attributions } = await supabaseServer
      .from(ATTRIBUTIONS_TABLE)
      .select("*, prospects(*)")
      .eq("campaignId", id);

    return {
      success: true,
      campaign: { ...campaign, budget: Number(campaign.budget) || 0 } as Campaign,
      directProspects: directProspects || [],
      attributions: attributions || [],
    };
  } catch (error) {
    console.error("[getCampaign] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createCampaign(data: Partial<Campaign>) {
  try {
    const validated = CampaignSchema.parse({
      ...data,
      budget: Number(data.budget) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(CAMPAIGNS_TABLE).insert(validated).select().single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/prospects");
    revalidatePath("/dashboard/crm/prospects/campaigns");
    return { success: true, id: inserted.id };
  } catch (error) {
    console.error("[createCampaign] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateCampaign(id: string, data: Partial<Campaign>) {
  try {
    const updateData = {
      ...data,
      budget: data.budget !== undefined ? Number(data.budget) : undefined,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(CAMPAIGNS_TABLE).update(updateData).eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/prospects");
    revalidatePath("/dashboard/crm/prospects/campaigns");
    return { success: true };
  } catch (error) {
    console.error("[updateCampaign] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteCampaign(id: string) {
  try {
    // Check if any prospects are linked
    const { count, error: countError } = await supabaseServer
      .from(PROSPECTS_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("primaryCampaignId", id);

    if (countError) throw new Error(countError.message);
    if (count && count > 0) {
      throw new Error("Cannot delete campaign because it is linked as primary campaign for active prospects");
    }

    const { error } = await supabaseServer.from(CAMPAIGNS_TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/prospects");
    revalidatePath("/dashboard/crm/prospects/campaigns");
    return { success: true };
  } catch (error) {
    console.error("[deleteCampaign] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function addCampaignTouch(data: Partial<ProspectCampaignAttribution>) {
  try {
    const validated = ProspectCampaignAttributionSchema.parse({
      ...data,
      touchDate: data.touchDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(ATTRIBUTIONS_TABLE).insert(validated).select().single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/prospects");
    revalidatePath("/dashboard/crm/prospects/campaigns");
    return { success: true, id: inserted.id };
  } catch (error) {
    console.error("[addCampaignTouch] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteCampaignTouch(id: string) {
  try {
    const { error } = await supabaseServer.from(ATTRIBUTIONS_TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/prospects");
    revalidatePath("/dashboard/crm/prospects/campaigns");
    return { success: true };
  } catch (error) {
    console.error("[deleteCampaignTouch] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}
