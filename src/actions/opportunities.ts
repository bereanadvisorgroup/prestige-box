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
    if (filters?.clientId) {
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
      const personIds = Array.from(
        new Set(
          list
            .map((o) => o.client?.personId)
            .filter(Boolean)
        )
      );

      if (personIds.length > 0) {
        const { data: people, error: peopleError } = await supabaseServer
          .from("people")
          .select("id, firstName, lastName, photoUrl")
          .in("id", personIds);

        if (!peopleError && people) {
          const peopleMap = people.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, any>);

          for (const opp of list) {
            if (opp.client && opp.client.personId) {
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

    if (record && record.client && record.client.personId) {
      const { data: person, error: personError } = await supabaseServer
        .from("people")
        .select("id, firstName, lastName")
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
    const { id: _, ...insertData } = validated;

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(insertData).select().single();

    if (error) throw new Error(error.message);

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
export async function updateOpportunity(id: string, data: Partial<Opportunity>) {
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
      if (key in validated) {
        updatePayload[key] = (validated as any)[key];
      }
    }

    const { data: existing, error: getError } = await supabaseServer
      .from(TABLE)
      .select("clientId, companyId, pipelineId")
      .eq("id", id)
      .single();

    if (getError) throw new Error(getError.message);

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
