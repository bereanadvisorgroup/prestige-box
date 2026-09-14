"use server";

import { revalidatePath } from "next/cache";

import { fetchAllRows } from "@/lib/fetch-chunks";
import { recordEvent } from "@/lib/history/record";
import { calculateProspectScore } from "@/lib/scoring";
import { supabaseServer } from "@/lib/supabase.server";
import { formatFullName } from "@/lib/utils";
import {
  type CsvHeaderMapping,
  type CsvImportResult,
  type DeduplicationStrategy,
  type EnrichedProspect,
  type Prospect,
  ProspectSchema,
  type ProspectScoringRule,
} from "@/types/prospects";

const PROSPECTS = "prospects";
const CAMPAIGNS = "campaigns";
const ATTRIBUTIONS = "prospect_campaign_attributions";
const SCORING_RULES = "prospect_scoring_rules";

export async function getProspects(): Promise<{
  success: boolean;
  prospects?: EnrichedProspect[];
  error?: string;
}> {
  try {
    const rawProspects = await fetchAllRows((from, to) =>
      supabaseServer.from(PROSPECTS).select("*").order("createdAt", { ascending: false }).range(from, to),
    );

    if (!rawProspects || rawProspects.length === 0) {
      return { success: true, prospects: [] };
    }

    // Fetch campaigns, users (reps), scoring rules
    const [campaignsRes, usersRes, rulesRes] = await Promise.all([
      fetchAllRows((from, to) => supabaseServer.from(CAMPAIGNS).select("id, name").range(from, to)),
      fetchAllRows((from, to) => supabaseServer.from("users").select("uid, firstName, lastName").range(from, to)),
      fetchAllRows((from, to) => supabaseServer.from(SCORING_RULES).select("*").range(from, to)),
    ]);

    const campaignMap = new Map((campaignsRes || []).map((c) => [c.id, c.name]));
    const userMap = new Map((usersRes || []).map((u) => [u.uid, formatFullName(u.firstName, u.lastName, "", "", "")]));
    const rules = (rulesRes || []) as ProspectScoringRule[];

    const enriched: EnrichedProspect[] = rawProspects.map((p) => {
      const scoringResult = calculateProspectScore(p, rules);
      return {
        ...p,
        score: p.score ?? scoringResult.score,
        scoreTemperature: scoringResult.temperature,
        scoreBreakdown: scoringResult.breakdown,
        primaryCampaignName: p.primaryCampaignId ? campaignMap.get(p.primaryCampaignId) || null : null,
        assignedRepName: p.assignedRepId ? userMap.get(p.assignedRepId) || null : null,
        isLinked: !!p.convertedClientId,
      };
    });

    return { success: true, prospects: enriched };
  } catch (error) {
    console.error("[getProspects] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getProspect(id: string) {
  try {
    const { data: prospect, error } = await supabaseServer.from(PROSPECTS).select("*").eq("id", id).single();

    if (error) throw new Error(error.message);
    if (!prospect) return { success: false, error: "Prospect not found" };

    // Fetch related entities: primary campaign, attributions, assigned rep, notes, tasks, change history
    const [attributionsRes, rulesRes, campaignRes, repRes, clientRes, notesAssocRes, tasksAssocRes, historyRes] =
      await Promise.all([
        supabaseServer
          .from(ATTRIBUTIONS)
          .select("*, campaigns(name, channel)")
          .eq("prospectId", id)
          .order("touchDate", { ascending: false }),
        supabaseServer.from(SCORING_RULES).select("*"),
        prospect.primaryCampaignId
          ? supabaseServer.from(CAMPAIGNS).select("*").eq("id", prospect.primaryCampaignId).maybeSingle()
          : Promise.resolve({ data: null }),
        prospect.assignedRepId
          ? supabaseServer
              .from("users")
              .select("uid, firstName, lastName, email")
              .eq("uid", prospect.assignedRepId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        prospect.convertedClientId
          ? supabaseServer.from("clients").select("id, personId").eq("id", prospect.convertedClientId).maybeSingle()
          : Promise.resolve({ data: null }),
        supabaseServer.from("note_associations").select("noteId").eq("entityType", "prospect").eq("entityId", id),
        supabaseServer.from("task_associations").select("taskId").eq("entityType", "prospect").eq("entityId", id),
        supabaseServer
          .from("change_history")
          .select("*")
          .eq("entityType", "prospect")
          .eq("entityId", id)
          .order("createdAt", { ascending: false }),
      ]);

    // Fetch notes if any
    const noteIds = (notesAssocRes.data || []).map((na) => na.noteId);
    const { data: notes } = noteIds.length
      ? await supabaseServer.from("notes").select("*").in("id", noteIds).order("createdAt", { ascending: false })
      : { data: [] };

    // Fetch tasks if any
    const taskIds = (tasksAssocRes.data || []).map((ta) => ta.taskId);
    const { data: tasks } = taskIds.length
      ? await supabaseServer.from("tasks").select("*").in("id", taskIds).order("createdAt", { ascending: false })
      : { data: [] };

    const rules = (rulesRes.data || []) as ProspectScoringRule[];
    const scoringResult = calculateProspectScore(prospect, rules);

    const enriched: EnrichedProspect = {
      ...prospect,
      score: prospect.score ?? scoringResult.score,
      scoreTemperature: scoringResult.temperature,
      scoreBreakdown: scoringResult.breakdown,
      primaryCampaignName: campaignRes.data?.name || null,
      assignedRepName: repRes.data ? formatFullName(repRes.data.firstName, repRes.data.lastName, "", "", "") : null,
      isLinked: !!prospect.convertedClientId,
    };

    return {
      success: true,
      prospect: enriched,
      primaryCampaign: campaignRes.data || null,
      assignedRep: repRes.data || null,
      convertedClient: clientRes.data || null,
      attributions: attributionsRes.data || [],
      notes: notes || [],
      tasks: tasks || [],
      history: historyRes.data || [],
    };
  } catch (error) {
    console.error("[getProspect] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createProspect(data: Partial<Prospect>) {
  try {
    // Load rules for initial score
    const { data: rules } = await supabaseServer.from(SCORING_RULES).select("*");
    const scoring = calculateProspectScore(data, (rules || []) as ProspectScoringRule[]);

    const validated = ProspectSchema.parse({
      ...data,
      score: scoring.score,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(PROSPECTS).insert(validated).select().single();

    if (error) throw new Error(error.message);

    // If primary campaign is specified, log initial touchpoint
    if (inserted.primaryCampaignId) {
      await supabaseServer.from(ATTRIBUTIONS).insert({
        prospectId: inserted.id,
        campaignId: inserted.primaryCampaignId,
        touchType: "Lead Creation",
        touchDate: new Date().toISOString(),
        notes: "Primary acquisition campaign linked upon prospect creation.",
      });
    }

    await recordEvent({
      entityType: "prospect",
      entityId: inserted.id,
      subType: "Profile",
      action: "created",
      newValue: `${inserted.firstName} ${inserted.lastName}`,
    });

    revalidatePath("/dashboard/crm/prospects");
    return { success: true, id: inserted.id };
  } catch (error) {
    console.error("[createProspect] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateProspect(id: string, data: Partial<Prospect>) {
  try {
    const { data: current } = await supabaseServer.from(PROSPECTS).select("*").eq("id", id).single();
    if (!current) throw new Error("Prospect not found");

    // Recalculate score with updated attributes
    const { data: rules } = await supabaseServer.from(SCORING_RULES).select("*");
    const merged = { ...current, ...data };
    const scoring = calculateProspectScore(merged, (rules || []) as ProspectScoringRule[]);

    const updatePayload = {
      ...data,
      score: scoring.score,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(PROSPECTS).update(updatePayload).eq("id", id);
    if (error) throw new Error(error.message);

    // Record stage change specifically if stage changed
    if (data.stage && data.stage !== current.stage) {
      await recordEvent({
        entityType: "prospect",
        entityId: id,
        subType: "Pipeline",
        action: "updated",
        fieldName: "stage",
        fieldLabel: "Stage",
        oldValue: current.stage,
        newValue: data.stage,
      });
    }

    revalidatePath("/dashboard/crm/prospects");
    revalidatePath(`/dashboard/crm/prospects/${id}`);
    return { success: true };
  } catch (error) {
    console.error("[updateProspect] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteProspect(id: string) {
  try {
    const { data: current } = await supabaseServer
      .from(PROSPECTS)
      .select("id, convertedClientId")
      .eq("id", id)
      .single();

    if (!current) throw new Error("Prospect not found");
    if (current.convertedClientId) {
      throw new Error("Cannot delete a prospect that has already been converted to an active client.");
    }

    const { error } = await supabaseServer.from(PROSPECTS).delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/prospects");
    return { success: true };
  } catch (error) {
    console.error("[deleteProspect] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function batchUpdateProspectStage(ids: string[], stage: string) {
  try {
    const { error } = await supabaseServer
      .from(PROSPECTS)
      .update({ stage, updatedAt: new Date().toISOString() })
      .in("id", ids);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/prospects");
    return { success: true };
  } catch (error) {
    console.error("[batchUpdateProspectStage] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function batchDeleteProspects(ids: string[]) {
  try {
    // Only delete prospects that haven't been converted
    const { data: eligible } = await supabaseServer
      .from(PROSPECTS)
      .select("id")
      .in("id", ids)
      .is("convertedClientId", null);

    const eligibleIds = (eligible || []).map((e) => e.id);
    if (eligibleIds.length === 0) {
      throw new Error("No deletable prospects selected (converted prospects cannot be deleted).");
    }

    const { error } = await supabaseServer.from(PROSPECTS).delete().in("id", eligibleIds);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/prospects");
    return { success: true, deletedCount: eligibleIds.length };
  } catch (error) {
    console.error("[batchDeleteProspects] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

/**
 * Converts a qualified prospect into an active Client & Person record.
 * 1. Creates person in 'people' table
 * 2. Creates client in 'clients' table
 * 3. Updates prospect with convertedClientId, convertedPersonId, convertedAt, stage='Closed Won'
 * 4. Logs note & history timeline
 */
export async function convertProspectToClient(prospectId: string, advisorId?: string | null) {
  try {
    const { data: prospect, error: fetchErr } = await supabaseServer
      .from(PROSPECTS)
      .select("*")
      .eq("id", prospectId)
      .single();

    if (fetchErr || !prospect) throw new Error("Prospect not found");
    if (prospect.convertedClientId) {
      throw new Error("This prospect has already been converted to a client.");
    }

    const now = new Date().toISOString();

    // 1. Prepare and insert Person
    const emails = prospect.email
      ? [{ id: crypto.randomUUID(), address: prospect.email, type: "Work" as const, isPrimary: true }]
      : [];
    const phones = prospect.phone
      ? [{ id: crypto.randomUUID(), number: prospect.phone, type: "Work" as const, isPrimary: true }]
      : [];

    const personPayload = {
      prefix: prospect.prefix || null,
      firstName: prospect.firstName,
      middleName: prospect.middleName || null,
      lastName: prospect.lastName,
      suffix: prospect.suffix || null,
      goesBy: prospect.goesBy || null,
      emails,
      phones,
      tags: ["Converted Prospect"],
      createdAt: now,
      updatedAt: now,
    };

    const { data: person, error: personErr } = await supabaseServer
      .from("people")
      .insert(personPayload)
      .select()
      .single();

    if (personErr) throw new Error(`Failed to create person: ${personErr.message}`);

    // 2. Prepare and insert Client
    const effectiveAdvisorId = advisorId || prospect.assignedRepId || null;
    const clientPayload = {
      personId: person.id,
      advisorId: effectiveAdvisorId,
      hobbies: [],
      favoriteSportsTeams: [],
      paymentAccounts: [],
      familyMembers: [],
      employments: prospect.company
        ? [
            {
              id: crypto.randomUUID(),
              companyName: prospect.company,
              position: prospect.jobTitle || "Executive",
              isCurrent: true,
            },
          ]
        : [],
      createdAt: now,
      updatedAt: now,
    };

    const { data: client, error: clientErr } = await supabaseServer
      .from("clients")
      .insert(clientPayload)
      .select()
      .single();

    if (clientErr) throw new Error(`Failed to create client: ${clientErr.message}`);

    // 3. Update Prospect record with links and mark 'Closed Won'
    const { error: prospectUpdateErr } = await supabaseServer
      .from(PROSPECTS)
      .update({
        convertedClientId: client.id,
        convertedPersonId: person.id,
        convertedAt: now,
        stage: "Closed Won",
        updatedAt: now,
      })
      .eq("id", prospectId);

    if (prospectUpdateErr) throw new Error(`Failed to update prospect: ${prospectUpdateErr.message}`);

    // 4. Create an initial activity Note linked to the prospect and the new client
    const { data: note } = await supabaseServer
      .from("notes")
      .insert({
        title: "Prospect Converted to Client",
        content: `<p>Successfully converted prospect <strong>${prospect.firstName} ${prospect.lastName}</strong> into an active client record.</p>`,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .maybeSingle();

    if (note) {
      await supabaseServer.from("note_associations").insert([
        { noteId: note.id, entityType: "prospect", entityId: prospectId },
        { noteId: note.id, entityType: "client", entityId: client.id },
      ]);
    }

    // 5. Record change history
    await recordEvent({
      entityType: "prospect",
      entityId: prospectId,
      subType: "Conversion",
      action: "updated",
      fieldName: "convertedClientId",
      fieldLabel: "Client Conversion",
      newValue: `Converted to Client (ID: ${client.id})`,
    });

    revalidatePath("/dashboard/crm/prospects");
    revalidatePath(`/dashboard/crm/prospects/${prospectId}`);
    revalidatePath("/dashboard/crm/clients");
    revalidatePath("/dashboard/crm/people");

    return {
      success: true,
      clientId: client.id,
      personId: person.id,
    };
  } catch (error) {
    console.error("[convertProspectToClient] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

/**
 * Multi-Step CSV Import Engine with Heuristic Mapping and Deduplication
 */
export async function batchImportProspects(
  rows: Record<string, unknown>[],
  mapping: CsvHeaderMapping[],
  deduplicationStrategy: DeduplicationStrategy,
  fallbackCampaignId?: string | null,
): Promise<CsvImportResult> {
  const result: CsvImportResult = {
    totalRows: rows.length,
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // 1. Fetch existing prospects to check for duplicates (keyed by lowercase email and normalized phone)
    const existingProspects = await fetchAllRows((from, to) =>
      supabaseServer.from(PROSPECTS).select("*").range(from, to),
    );

    const emailMap = new Map<string, (typeof existingProspects)[number]>();
    const phoneMap = new Map<string, (typeof existingProspects)[number]>();

    for (const p of existingProspects || []) {
      if (p.email) emailMap.set(p.email.toLowerCase().trim(), p);
      if (p.phone) {
        const cleanPhone = p.phone.replace(/\D/g, "");
        if (cleanPhone.length >= 7) phoneMap.set(cleanPhone, p);
      }
    }

    // 2. Fetch active scoring rules
    const { data: rules } = await supabaseServer.from(SCORING_RULES).select("*");
    const activeRules = (rules || []) as ProspectScoringRule[];

    // 3. Process each row
    const now = new Date().toISOString();

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNumber = index + 2; // +1 for 0-index, +1 for CSV header row

      try {
        const prospectData: Partial<Prospect> & { customFields: Record<string, unknown> } = {
          customFields: {},
          stage: "New",
          source: "Inbound",
          primaryCampaignId: fallbackCampaignId || null,
        };

        // Apply mapped fields
        for (const mapItem of mapping) {
          const rawVal = row[mapItem.csvHeader];
          if (rawVal === undefined || rawVal === null || String(rawVal).trim() === "") continue;

          const strVal = String(rawVal).trim();

          if (mapItem.targetField.startsWith("customFields.")) {
            const fieldKey = mapItem.targetField.replace("customFields.", "");
            prospectData.customFields[fieldKey] = strVal;
          } else {
            (prospectData as Record<string, unknown>)[mapItem.targetField] = strVal;
          }
        }

        // Handle combined name parsing if firstName & lastName aren't both present
        if ((prospectData as Record<string, unknown>).name || (!prospectData.firstName && !prospectData.lastName)) {
          const rawName = String(
            (prospectData as Record<string, unknown>).name || row.name || row.Name || row["Full Name"] || "",
          ).trim();
          delete (prospectData as Record<string, unknown>).name;

          if (rawName) {
            const parts = rawName.split(/\s+/);
            const knownPrefixes = [
              "mr",
              "mr.",
              "mrs",
              "mrs.",
              "ms",
              "ms.",
              "miss",
              "dr",
              "dr.",
              "prof",
              "prof.",
              "rev",
              "rev.",
            ];
            const knownSuffixes = ["jr", "jr.", "sr", "sr.", "ii", "iii", "iv", "v", "phd", "md", "esq", "esq."];

            let startIdx = 0;
            let endIdx = parts.length;

            if (parts.length > 1 && knownPrefixes.includes(parts[0].toLowerCase())) {
              if (!prospectData.prefix) prospectData.prefix = parts[0];
              startIdx++;
            }

            if (parts.length > 2 && knownSuffixes.includes(parts[parts.length - 1].toLowerCase())) {
              if (!prospectData.suffix) prospectData.suffix = parts[parts.length - 1];
              endIdx--;
            }

            const remaining = parts.slice(startIdx, endIdx);
            if (remaining.length === 1) {
              if (!prospectData.firstName) prospectData.firstName = remaining[0];
              if (!prospectData.lastName) prospectData.lastName = "Prospect";
            } else if (remaining.length === 2) {
              if (!prospectData.firstName) prospectData.firstName = remaining[0];
              if (!prospectData.lastName) prospectData.lastName = remaining[1];
            } else if (remaining.length >= 3) {
              if (!prospectData.firstName) prospectData.firstName = remaining[0];
              if (!prospectData.middleName) prospectData.middleName = remaining.slice(1, -1).join(" ");
              if (!prospectData.lastName) prospectData.lastName = remaining[remaining.length - 1];
            }
          }
        }

        // Validate basic requirement: name
        if (!prospectData.firstName && !prospectData.lastName) {
          result.errors.push({
            rowNumber,
            data: row,
            error: "Missing required contact name (First or Last name)",
          });
          continue;
        }
        if (!prospectData.firstName) prospectData.firstName = "Unknown";
        if (!prospectData.lastName) prospectData.lastName = "Prospect";

        // Check deduplication
        const emailKey = prospectData.email?.toLowerCase().trim();
        const cleanPhone = prospectData.phone ? prospectData.phone.replace(/\D/g, "") : "";

        let match = emailKey ? emailMap.get(emailKey) : null;
        if (!match && cleanPhone && cleanPhone.length >= 7) {
          match = phoneMap.get(cleanPhone) || null;
        }

        if (match) {
          // Record campaign touchpoint for existing match if associated campaign provided
          if (fallbackCampaignId) {
            const { data: existingTouch } = await supabaseServer
              .from(ATTRIBUTIONS)
              .select("id")
              .eq("prospectId", match.id)
              .eq("campaignId", fallbackCampaignId)
              .maybeSingle();

            if (!existingTouch) {
              await supabaseServer.from(ATTRIBUTIONS).insert({
                prospectId: match.id,
                campaignId: fallbackCampaignId,
                touchType: "Mid Touch",
                touchDate: now,
                notes: "Updated via CSV Data Engine import",
              });
            }
          }

          // Existing match found
          if (deduplicationStrategy === "skip") {
            result.skipped++;
            result.processed++;
            continue;
          }

          if (deduplicationStrategy === "overwrite") {
            const merged = {
              ...match,
              ...prospectData,
              customFields: {
                ...(match.customFields || {}),
                ...prospectData.customFields,
              },
              updatedAt: now,
            };
            const scoring = calculateProspectScore(merged, activeRules);
            merged.score = scoring.score;

            await supabaseServer.from(PROSPECTS).update(merged).eq("id", match.id);
            result.updated++;
            result.processed++;
            continue;
          }

          if (deduplicationStrategy === "update_empty") {
            const patch: Record<string, unknown> = {
              customFields: { ...(match.customFields || {}) },
            };

            for (const [k, v] of Object.entries(prospectData)) {
              if (k === "customFields") {
                for (const [cfKey, cfVal] of Object.entries(prospectData.customFields)) {
                  if (!(match.customFields as Record<string, unknown>)?.[cfKey]) {
                    (patch.customFields as Record<string, unknown>)[cfKey] = cfVal;
                  }
                }
              } else if (!match[k] && v) {
                patch[k] = v;
              }
            }

            patch.updatedAt = now;
            const merged = { ...match, ...patch };
            const scoring = calculateProspectScore(merged, activeRules);
            patch.score = scoring.score;

            await supabaseServer.from(PROSPECTS).update(patch).eq("id", match.id);
            result.updated++;
            result.processed++;
            continue;
          }
        }

        // New record insert
        const scoring = calculateProspectScore(prospectData, activeRules);
        prospectData.score = scoring.score;
        prospectData.createdAt = now;
        prospectData.updatedAt = now;

        const { data: inserted, error: insertErr } = await supabaseServer
          .from(PROSPECTS)
          .insert(prospectData)
          .select()
          .single();

        if (insertErr) {
          result.errors.push({
            rowNumber,
            data: row,
            error: insertErr.message,
          });
        } else {
          result.created++;
          result.processed++;

          // Keep maps updated for intra-batch deduplication
          if (inserted.email) emailMap.set(inserted.email.toLowerCase().trim(), inserted);
          if (inserted.phone) {
            const pDigits = inserted.phone.replace(/\D/g, "");
            if (pDigits.length >= 7) phoneMap.set(pDigits, inserted);
          }

          if (inserted.primaryCampaignId) {
            await supabaseServer.from(ATTRIBUTIONS).insert({
              prospectId: inserted.id,
              campaignId: inserted.primaryCampaignId,
              touchType: "Lead Creation",
              touchDate: now,
              notes: "Imported via CSV Data Engine",
            });
          }
        }
      } catch (rowErr) {
        result.errors.push({
          rowNumber,
          data: row,
          error: (rowErr as Error).message || "Unknown parsing error",
        });
      }
    }

    revalidatePath("/dashboard/crm/prospects");
    return result;
  } catch (err) {
    console.error("[batchImportProspects] Fatal error:", err);
    result.errors.push({
      rowNumber: 0,
      data: {},
      error: (err as Error).message || "System error during import processing",
    });
    return result;
  }
}

/**
 * Re-evaluates all prospects against active scoring rules and updates scores.
 */
export async function recalculateAllScores() {
  try {
    const [prospects, rules] = await Promise.all([
      fetchAllRows((from, to) => supabaseServer.from(PROSPECTS).select("*").range(from, to)),
      fetchAllRows((from, to) => supabaseServer.from(SCORING_RULES).select("*").range(from, to)),
    ]);

    const activeRules = (rules || []) as ProspectScoringRule[];
    let updatedCount = 0;

    for (const p of prospects || []) {
      const scoring = calculateProspectScore(p, activeRules);
      if (p.score !== scoring.score) {
        await supabaseServer.from(PROSPECTS).update({ score: scoring.score }).eq("id", p.id);
        updatedCount++;
      }
    }

    revalidatePath("/dashboard/crm/prospects");
    return { success: true, updatedCount };
  } catch (error) {
    console.error("[recalculateAllScores] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

/**
 * Logs a phone call with a prospect into notes, associations, and change history.
 */
export async function logProspectCall(data: {
  prospectId: string;
  prospectName: string;
  outcome: string;
  durationMinutes: number;
  notes?: string;
}) {
  try {
    const now = new Date().toISOString();
    const noteTitle = `Call Log: ${data.outcome}`;
    const noteContent = `<p><strong>Call with:</strong> ${data.prospectName}</p><p><strong>Outcome:</strong> ${data.outcome}</p><p><strong>Duration:</strong> ${data.durationMinutes} min</p>${data.notes ? `<p><strong>Discussion:</strong> ${data.notes}</p>` : ""}`;

    const { data: note, error: noteErr } = await supabaseServer
      .from("notes")
      .insert({
        title: noteTitle,
        content: noteContent,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (noteErr) throw new Error(noteErr.message);

    await supabaseServer.from("note_associations").insert({
      noteId: note.id,
      entityType: "prospect",
      entityId: data.prospectId,
    });

    await recordEvent({
      entityType: "prospect",
      entityId: data.prospectId,
      subType: "Call",
      action: "created",
      newValue: `Logged Call: ${data.outcome} (${data.durationMinutes}m)`,
    });

    revalidatePath(`/dashboard/crm/prospects/${data.prospectId}`);
    return { success: true, id: note.id };
  } catch (error) {
    console.error("[logProspectCall] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}
