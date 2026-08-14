"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer, verifyAdmin } from "@/lib/supabase.server";
import { type OpportunityPipeline, OpportunityPipelineSchema } from "@/types/crm";

const PIPELINES_TABLE = "opportunity_pipelines";
const STAGES_TABLE = "opportunity_pipeline_stages";

/**
 * Fetch all opportunity pipelines with their stages.
 * Calculated if they are linked to any opportunities.
 */
export async function getOpportunityPipelines() {
  try {
    // Fetch pipelines
    const { data: pipelines, error: pipelinesError } = await supabaseServer
      .from(PIPELINES_TABLE)
      .select("*")
      .order("name", { ascending: true });

    if (pipelinesError) throw new Error(pipelinesError.message);
    if (!pipelines || pipelines.length === 0) {
      return { success: true, pipelines: [] };
    }

    // Fetch stages for all pipelines
    const pipelineIds = pipelines.map((p) => p.id);
    const { data: stages, error: stagesError } = await supabaseServer
      .from(STAGES_TABLE)
      .select("*")
      .in("pipelineId", pipelineIds)
      .order("order", { ascending: true });

    if (stagesError) throw new Error(stagesError.message);

    // Fetch opportunity counts to determine if a pipeline is linked
    const { data: counts, error: countsError } = await supabaseServer.from("opportunities").select("pipelineId");

    if (countsError) throw new Error(countsError.message);

    const linkedPipelineIds = new Set((counts || []).map((o) => o.pipelineId));

    // Combine pipelines with their stages
    const stagesMap = (stages || []).reduce(
      (acc, s) => {
        if (!acc[s.pipelineId]) acc[s.pipelineId] = [];
        acc[s.pipelineId].push(s);
        return acc;
      },
      {} as Record<string, typeof stages>,
    );

    const enrichedPipelines = pipelines.map((p) => ({
      ...p,
      stages: stagesMap[p.id] || [],
      isLinked: linkedPipelineIds.has(p.id),
    }));

    return { success: true, pipelines: enrichedPipelines };
  } catch (error) {
    console.error("[getOpportunityPipelines] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch a single opportunity pipeline by ID, including its stages.
 */
export async function getOpportunityPipeline(id: string) {
  try {
    const { data: pipeline, error: pipelineError } = await supabaseServer
      .from(PIPELINES_TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (pipelineError) throw new Error(pipelineError.message);

    const { data: stages, error: stagesError } = await supabaseServer
      .from(STAGES_TABLE)
      .select("*")
      .eq("pipelineId", id)
      .order("order", { ascending: true });

    if (stagesError) throw new Error(stagesError.message);

    return {
      success: true,
      pipeline: {
        ...pipeline,
        stages: stages || [],
      } as OpportunityPipeline,
    };
  } catch (error) {
    console.error("[getOpportunityPipeline] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Create a new opportunity pipeline with stages. Admin-only.
 */
export async function createOpportunityPipeline(data: Partial<OpportunityPipeline>) {
  try {
    await verifyAdmin();

    const validated = OpportunityPipelineSchema.parse(data);

    // Insert pipeline
    const { data: insertedPipeline, error: pipelineError } = await supabaseServer
      .from(PIPELINES_TABLE)
      .insert({
        name: validated.name,
        isActive: validated.isActive,
        hasFlatFee: validated.hasFlatFee,
        hasAum: validated.hasAum,
        hasLifeInsurance: validated.hasLifeInsurance,
      })
      .select()
      .single();

    if (pipelineError) throw new Error(pipelineError.message);

    // Insert stages
    const stagesToInsert = validated.stages.map((stage, idx) => ({
      pipelineId: insertedPipeline.id,
      name: stage.name,
      order: stage.order ?? idx,
    }));

    const { error: stagesError } = await supabaseServer.from(STAGES_TABLE).insert(stagesToInsert);

    if (stagesError) {
      // Cleanup pipeline on failure
      await supabaseServer.from(PIPELINES_TABLE).delete().eq("id", insertedPipeline.id);
      throw new Error(stagesError.message);
    }

    revalidatePath("/dashboard/admin/opportunities");
    revalidatePath("/dashboard/crm/opportunities");

    return { success: true, id: insertedPipeline.id };
  } catch (error) {
    console.error("[createOpportunityPipeline] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update an existing opportunity pipeline and its stages. Admin-only.
 */
export async function updateOpportunityPipeline(id: string, data: Partial<OpportunityPipeline>) {
  try {
    await verifyAdmin();

    const validated = OpportunityPipelineSchema.parse({
      ...data,
      id,
    });

    // 1. Update pipeline record
    const { error: pipelineError } = await supabaseServer
      .from(PIPELINES_TABLE)
      .update({
        name: validated.name,
        isActive: validated.isActive,
        hasFlatFee: validated.hasFlatFee,
        hasAum: validated.hasAum,
        hasLifeInsurance: validated.hasLifeInsurance,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);

    if (pipelineError) throw new Error(pipelineError.message);

    // 2. Manage stages. Get current stages from the DB.
    const { data: currentStages, error: currentStagesError } = await supabaseServer
      .from(STAGES_TABLE)
      .select("id")
      .eq("pipelineId", id);

    if (currentStagesError) throw new Error(currentStagesError.message);

    const currentStageIds = new Set((currentStages || []).map((s) => s.id));
    const incomingStageIds = new Set(validated.stages.map((s) => s.id).filter(Boolean));

    // Determine stages to delete
    const stagesToDelete = Array.from(currentStageIds).filter((cid) => !incomingStageIds.has(cid));

    if (stagesToDelete.length > 0) {
      // Check if any of these stages are currently in use by opportunities
      const { data: linkedOpportunities, error: linkedError } = await supabaseServer
        .from("opportunities")
        .select("id, stageId")
        .in("stageId", stagesToDelete);

      if (linkedError) throw new Error(linkedError.message);

      if (linkedOpportunities && linkedOpportunities.length > 0) {
        throw new Error(
          "Cannot delete stage(s) that are currently linked to active opportunities. Please reassign the opportunities first.",
        );
      }

      const { error: deleteError } = await supabaseServer.from(STAGES_TABLE).delete().in("id", stagesToDelete);

      if (deleteError) throw new Error(deleteError.message);
    }

    // Upsert incoming stages
    for (const stage of validated.stages) {
      if (stage.id && currentStageIds.has(stage.id)) {
        // Update
        const { error: updateStageError } = await supabaseServer
          .from(STAGES_TABLE)
          .update({
            name: stage.name,
            order: stage.order,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", stage.id);

        if (updateStageError) throw new Error(updateStageError.message);
      } else {
        // Insert
        const { error: insertStageError } = await supabaseServer.from(STAGES_TABLE).insert({
          pipelineId: id,
          name: stage.name,
          order: stage.order,
        });

        if (insertStageError) throw new Error(insertStageError.message);
      }
    }

    revalidatePath("/dashboard/admin/opportunities");
    revalidatePath(`/dashboard/admin/opportunities/${id}`);
    revalidatePath("/dashboard/crm/opportunities");

    return { success: true };
  } catch (error) {
    console.error("[updateOpportunityPipeline] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete an opportunity pipeline. Allowed only if never used. Admin-only.
 */
export async function deleteOpportunityPipeline(id: string) {
  try {
    await verifyAdmin();

    // Check if the pipeline is linked to any opportunities
    const { data: count, error: countError } = await supabaseServer
      .from("opportunities")
      .select("id")
      .eq("pipelineId", id)
      .limit(1);

    if (countError) throw new Error(countError.message);

    if (count && count.length > 0) {
      throw new Error("Cannot delete pipeline: It contains opportunities.");
    }

    const { error: deleteError } = await supabaseServer.from(PIPELINES_TABLE).delete().eq("id", id);

    if (deleteError) throw new Error(deleteError.message);

    revalidatePath("/dashboard/admin/opportunities");
    revalidatePath("/dashboard/crm/opportunities");

    return { success: true };
  } catch (error) {
    console.error("[deleteOpportunityPipeline] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch the Default AUM % from keyvals.
 */
export async function getDefaultAumPerc() {
  try {
    const { data, error } = await supabaseServer.from("keyvals").select("value").eq("id", "DEFAULT_AUM_PERC").single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found, return default of 1
        return { success: true, value: 1 };
      }
      throw error;
    }

    const value = data ? Number.parseFloat(data.value) : 1;
    return { success: true, value: Number.isNaN(value) ? 1 : value };
  } catch (error) {
    console.error("[getDefaultAumPerc] Error:", error);
    return { success: false, error: (error as Error).message, value: 1 };
  }
}

/**
 * Update the Default AUM % in keyvals. Admin-only.
 */
export async function updateDefaultAumPerc(value: number) {
  try {
    await verifyAdmin();

    if (Number.isNaN(value) || value < 0) {
      throw new Error("Invalid AUM percentage value.");
    }

    const { error } = await supabaseServer.from("keyvals").upsert({
      id: "DEFAULT_AUM_PERC",
      value: value.toString(),
      updatedAt: new Date().toISOString(),
    });

    if (error) throw error;

    revalidatePath("/dashboard/admin/opportunities");
    return { success: true };
  } catch (error) {
    console.error("[updateDefaultAumPerc] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
