"use server";

import { revalidatePath } from "next/cache";

import { fetchAllRows } from "@/lib/fetch-chunks";
import { supabaseServer } from "@/lib/supabase.server";
import { type ProspectScoringRule, ProspectScoringRuleSchema } from "@/types/prospects";

const TABLE = "prospect_scoring_rules";

export async function getProspectScoringRules(): Promise<{
  success: boolean;
  rules?: ProspectScoringRule[];
  error?: string;
}> {
  try {
    const raw = await fetchAllRows((from, to) =>
      supabaseServer.from(TABLE).select("*").order("name", { ascending: true }).range(from, to),
    );

    return { success: true, rules: (raw || []) as ProspectScoringRule[] };
  } catch (error) {
    console.error("[getProspectScoringRules] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createProspectScoringRule(data: Partial<ProspectScoringRule>) {
  try {
    const validated = ProspectScoringRuleSchema.parse({
      ...data,
      points: Number(data.points) || 0,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/prospects");
    revalidatePath("/dashboard/crm/prospects/score-rules");
    return { success: true, id: inserted.id };
  } catch (error) {
    console.error("[createProspectScoringRule] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateProspectScoringRule(id: string, data: Partial<ProspectScoringRule>) {
  try {
    const { error } = await supabaseServer
      .from(TABLE)
      .update({
        ...data,
        points: data.points !== undefined ? Number(data.points) : undefined,
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/prospects");
    revalidatePath("/dashboard/crm/prospects/score-rules");
    return { success: true };
  } catch (error) {
    console.error("[updateProspectScoringRule] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteProspectScoringRule(id: string) {
  try {
    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/prospects");
    revalidatePath("/dashboard/crm/prospects/score-rules");
    return { success: true };
  } catch (error) {
    console.error("[deleteProspectScoringRule] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}
