"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser, supabaseServer } from "@/lib/supabase.server";
import { type Opportunity, OpportunitySchema } from "@/types/crm";

const TABLE = "opportunities";

/**
 * Fetch opportunities based on optional filters.
 * Returns joined relations for client, company, pipeline, stage, and updatedBy user.
 */
export async function getOpportunities(filters?: {
  pipelineId?: string;
  clientId?: string;
  clientIds?: string[];
  companyId?: string;
  resultStatus?: string | null; // e.g. 'active' (to get non-closed ones) or specific result status
}) {
  try {
    let query = supabaseServer.from(TABLE).select(`
      *,
      client:clients (
        id,
        personId
      ),
      company:companies (id, name, logoUrl),
      pipeline:opportunity_pipelines (id, name),
      stage:opportunity_pipeline_stages (id, name, "order"),
      updatedBy:users (uid, firstName, lastName)
    `);

    if (filters?.pipelineId) {
      query = query.eq("pipelineId", filters.pipelineId);
    }
    if (filters?.clientIds && filters.clientIds.length > 0) {
      query = query.in("clientId", filters.clientIds);
    } else if (filters?.clientId) {
      query = query.eq("clientId", filters.clientId);
    }
    if (filters?.companyId) {
      query = query.eq("companyId", filters.companyId);
    }

    if (filters?.resultStatus === "active") {
      query = query.is("resultStatus", null);
    } else if (filters?.resultStatus) {
      query = query.eq("resultStatus", filters.resultStatus);
    }

    const { data: list, error } = await query.order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);

    if (list && list.length > 0) {
      // Map people details for client associations manually
      const personIds = Array.from(new Set(list.map((o) => o.client?.personId).filter(Boolean)));

      if (personIds.length > 0) {
        const { data: people, error: peopleError } = await supabaseServer
          .from("people")
          .select("id, firstName, lastName, suffix, photoUrl")
          .in("id", personIds);

        if (!peopleError && people) {
          const peopleMap = people.reduce(
            (acc, p) => {
              acc[p.id] = p;
              return acc;
            },
            {} as Record<string, any>,
          );

          for (const opp of list) {
            if (opp.client?.personId) {
              opp.client.person = peopleMap[opp.client.personId] || null;
            }
          }
        }
      }
    }

    return { success: true, opportunities: list || [] };
  } catch (error) {
    console.error("[getOpportunities] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch a single opportunity by ID.
 */
export async function getOpportunity(id: string) {
  try {
    const { data: record, error } = await supabaseServer
      .from(TABLE)
      .select(`
        *,
        client:clients (
          id,
          personId
        ),
        company:companies (id, name),
        pipeline:opportunity_pipelines (id, name),
        stage:opportunity_pipeline_stages (id, name, "order"),
        updatedBy:users (uid, firstName, lastName)
      `)
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);

    if (record?.client?.personId) {
      const { data: person, error: personError } = await supabaseServer
        .from("people")
        .select("id, firstName, lastName, suffix")
        .eq("id", record.client.personId)
        .single();

      if (!personError && person) {
        record.client.person = person;
      } else {
        record.client.person = null;
      }
    }

    return { success: true, opportunity: record };
  } catch (error) {
    console.error("[getOpportunity] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Create a new opportunity.
 */
export async function createOpportunity(data: Partial<Opportunity>) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized: Please sign in.");

    const validated = OpportunitySchema.parse({
      ...data,
      updatedById: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Make sure either client or company is provided
    if (!validated.clientId && !validated.companyId) {
      throw new Error("Opportunity must be associated with either a Client or a Company.");
    }

    // Omit id if it is an empty string/null to let database generate a UUID
    // Omit changeReason because it's not a database column
    const { id: _, changeReason, ...insertData } = validated as any;

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(insertData).select().single();

    if (error) throw new Error(error.message);

    // Create history entry
    const { data: userProfile } = await supabaseServer
      .from("users")
      .select("firstName, lastName")
      .eq("uid", user.id)
      .single();
    const actorName = userProfile
      ? `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim()
      : user.email || "Unknown User";

    await supabaseServer.from("opportunity_history").insert({
      opportunityId: inserted.id,
      type: "created",
      actorId: user.id,
      actorName,
      createdAt: inserted.createdAt,
    });

    revalidatePath("/dashboard/crm/opportunities");
    if (validated.clientId) {
      revalidatePath(`/dashboard/crm/clients/${validated.clientId}/internal/opportunities`);
    }
    if (validated.companyId) {
      revalidatePath(`/dashboard/crm/companies/${validated.companyId}/internal/opportunities`);
    }

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error("[createOpportunity] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update an existing opportunity.
 */
export async function updateOpportunity(id: string, data: Partial<Opportunity> & { changeReason?: string | null }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized: Please sign in.");

    // Validate incoming changes
    const validated = OpportunitySchema.partial().parse({
      ...data,
      updatedById: user.id,
      updatedAt: new Date().toISOString(),
    });

    // Strip out fields not explicitly passed in 'data' to prevent Zod defaults from overwriting DB values
    const updatePayload: Record<string, any> = {
      updatedById: validated.updatedById,
      updatedAt: validated.updatedAt,
    };

    for (const key of Object.keys(data)) {
      if (key in validated && key !== "changeReason") {
        updatePayload[key] = (validated as any)[key];
      }
    }

    // Fetch existing record to check for changes and for path revalidations
    const { data: existing, error: getError } = await supabaseServer
      .from(TABLE)
      .select("clientId, companyId, pipelineId, targetCloseDate, closeDate, resultStatus")
      .eq("id", id)
      .single();

    if (getError) throw new Error(getError.message);

    // Auto-populate closeDate if resultStatus changes
    if ("resultStatus" in data) {
      if (data.resultStatus) {
        // If transitioning to closed (WON/LOST/TRASH), populate closeDate if not already set
        if (!updatePayload.closeDate) {
          updatePayload.closeDate = new Date().toISOString();
        }
      } else {
        // If transitioning to Active, clear closeDate
        updatePayload.closeDate = null;
      }
    }

    // Check if targetCloseDate has changed
    const normalizeDate = (d: any) => {
      if (!d) return null;
      const dateStr = typeof d === "string" ? d : new Date(d).toISOString();
      return dateStr.slice(0, 10);
    };

    const oldNormalized = normalizeDate(existing.targetCloseDate);
    const newNormalized = normalizeDate(
      updatePayload.targetCloseDate !== undefined ? updatePayload.targetCloseDate : existing.targetCloseDate,
    );
    const isTargetCloseDateChanged = "targetCloseDate" in updatePayload && oldNormalized !== newNormalized;

    if (isTargetCloseDateChanged) {
      const { data: userProfile } = await supabaseServer
        .from("users")
        .select("firstName, lastName")
        .eq("uid", user.id)
        .single();
      const actorName = userProfile
        ? `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim()
        : user.email || "Unknown User";

      await supabaseServer.from("opportunity_history").insert({
        opportunityId: id,
        type: "target_close_date_change",
        oldValue: oldNormalized,
        newValue: newNormalized,
        reason: data.changeReason || "No reason provided",
        actorId: user.id,
        actorName,
        createdAt: new Date().toISOString(),
      });
    }

    const { error } = await supabaseServer.from(TABLE).update(updatePayload).eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/opportunities");
    if (existing.clientId) {
      revalidatePath(`/dashboard/crm/clients/${existing.clientId}/internal/opportunities`);
    }
    if (existing.companyId) {
      revalidatePath(`/dashboard/crm/companies/${existing.companyId}/internal/opportunities`);
    }

    return { success: true };
  } catch (error) {
    console.error("[updateOpportunity] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete an opportunity.
 */
export async function deleteOpportunity(id: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized: Please sign in.");

    const { data: existing, error: getError } = await supabaseServer
      .from(TABLE)
      .select("clientId, companyId")
      .eq("id", id)
      .single();

    if (getError) throw new Error(getError.message);

    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/opportunities");
    if (existing.clientId) {
      revalidatePath(`/dashboard/crm/clients/${existing.clientId}/internal/opportunities`);
    }
    if (existing.companyId) {
      revalidatePath(`/dashboard/crm/companies/${existing.companyId}/internal/opportunities`);
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteOpportunity] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch opportunity history logs.
 */
export async function getOpportunityHistory(opportunityId: string) {
  try {
    const { data, error } = await supabaseServer
      .from("opportunity_history")
      .select("*")
      .eq("opportunityId", opportunityId)
      .order("createdAt", { ascending: true });

    if (error) throw new Error(error.message);

    return { success: true, history: data || [] };
  } catch (error) {
    console.error("[getOpportunityHistory] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch all target date change history entries across opportunities.
 */
export async function getOpportunityTargetDateHistory() {
  try {
    const { data, error } = await supabaseServer
      .from("opportunity_history")
      .select("*")
      .eq("type", "target_close_date_change")
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);

    return { success: true, history: data || [] };
  } catch (error) {
    console.error("[getOpportunityTargetDateHistory] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch open opportunities for clients assigned to a specific advisor/user.
 */
export async function getAssignedActiveOpportunitiesForUser(userId: string) {
  try {
    // 1. Fetch client IDs where advisorId = userId
    const { data: clients, error: clientsError } = await supabaseServer
      .from("clients")
      .select("id")
      .eq("advisorId", userId);

    if (clientsError) throw new Error(clientsError.message);
    if (!clients || clients.length === 0) {
      return { success: true, opportunities: [] };
    }

    const clientIds = clients.map((c) => c.id);

    // 2. Fetch opportunities where:
    // - clientId in clientIds
    // - resultStatus IS NULL (active/open)
    // - closeDate IS NULL (not closed)
    // - ordered by targetCloseDate ascending, nulls last
    const { data: list, error } = await supabaseServer
      .from(TABLE)
      .select(`
        *,
        client:clients (
          id,
          personId
        ),
        company:companies (id, name, logoUrl),
        pipeline:opportunity_pipelines (id, name),
        stage:opportunity_pipeline_stages (id, name, "order"),
        updatedBy:users (uid, firstName, lastName)
      `)
      .in("clientId", clientIds)
      .is("resultStatus", null)
      .is("closeDate", null)
      .order("targetCloseDate", { ascending: true, nullsFirst: false });

    if (error) throw new Error(error.message);

    if (list && list.length > 0) {
      // Map people details for client associations manually
      const personIds = Array.from(new Set(list.map((o) => o.client?.personId).filter(Boolean)));

      if (personIds.length > 0) {
        const { data: people, error: peopleError } = await supabaseServer
          .from("people")
          .select("id, firstName, lastName, suffix, photoUrl")
          .in("id", personIds);

        if (!peopleError && people) {
          const peopleMap = people.reduce(
            (acc, p) => {
              acc[p.id] = p;
              return acc;
            },
            {} as Record<string, any>,
          );

          for (const opp of list) {
            if (opp.client?.personId) {
              opp.client.person = peopleMap[opp.client.personId] || null;
            }
          }
        }
      }
    }

    return { success: true, opportunities: list || [] };
  } catch (error) {
    console.error("[getAssignedActiveOpportunitiesForUser] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
