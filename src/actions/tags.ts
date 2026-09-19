"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";
import type { Person, Tag, TagWithCount } from "@/types/crm";

const TABLE = "tags";

interface TagRpcRow {
  id: string;
  name: string;
  color?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  peopleCount?: number | string | null;
}

/**
 * Fetch all unique tags ordered alphabetically by name.
 */
export async function getTags() {
  try {
    const { data: tags, error } = await supabaseServer.from(TABLE).select("*").order("name", { ascending: true });

    if (error) throw new Error(error.message);

    return { success: true, tags: (tags || []) as Tag[] };
  } catch (error) {
    console.error("[getTags] Error:", error);
    return { success: false, tags: [] as Tag[], error: (error as Error).message };
  }
}

/**
 * Fetch all tags with the count of assigned people and isLinked status.
 */
export async function getTagsWithCounts() {
  try {
    const { data, error } = await supabaseServer.rpc("get_tags_with_counts");

    if (error) {
      // Fallback if RPC fails or not loaded yet
      console.warn("[getTagsWithCounts] RPC error, falling back to query:", error.message);
      const { data: tags, error: tagsError } = await supabaseServer
        .from(TABLE)
        .select("*")
        .order("name", { ascending: true });

      if (tagsError) throw new Error(tagsError.message);

      const enriched: TagWithCount[] = (tags || []).map((t) => ({
        ...t,
        peopleCount: 0,
        isLinked: false,
      }));

      return { success: true, tags: enriched };
    }

    const rows = (data || []) as TagRpcRow[];
    const enriched: TagWithCount[] = rows.map((row) => {
      const count = Number(row.peopleCount ?? 0);
      return {
        id: row.id,
        name: row.name,
        color: row.color || "#64748B",
        createdAt: row.createdAt ?? undefined,
        updatedAt: row.updatedAt ?? undefined,
        peopleCount: count,
        isLinked: count > 0,
      };
    });

    return { success: true, tags: enriched };
  } catch (error) {
    console.error("[getTagsWithCounts] Error:", error);
    return { success: false, tags: [] as TagWithCount[], error: (error as Error).message };
  }
}

/**
 * Fetch a single tag by ID with details and associated people records.
 */
export async function getTag(id: string) {
  try {
    const { data: tag, error: tagError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (tagError) throw new Error(tagError.message);
    if (!tag) return { success: false, error: "Tag not found" };

    // Fetch people assigned this tag
    const { data: people, error: peopleError } = await supabaseServer
      .from("people")
      .select("id, firstName, lastName, photoUrl, emails, phones, prefix, suffix, goesBy, tags")
      .contains("tags", JSON.stringify([tag.name]));

    if (peopleError) {
      console.warn("[getTag] Failed to fetch linked people:", peopleError.message);
    }

    const linkedPeople = (people || []) as Person[];

    return {
      success: true,
      tag: tag as Tag,
      peopleCount: linkedPeople.length,
      people: linkedPeople,
    };
  } catch (error) {
    console.error("[getTag] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Create a new tag if it does not already exist (case-insensitive check).
 */
export async function createTag(input: string | { name: string; color?: string }) {
  try {
    const rawName = typeof input === "string" ? input : input.name;
    const rawColor = typeof input === "object" ? input.color : undefined;

    const cleanName = (rawName || "").trim();
    const cleanColor = (rawColor || "#64748B").trim();

    if (!cleanName) {
      return { success: false, error: "Tag name cannot be empty" };
    }

    // Check if tag already exists case-insensitively
    const { data: existing, error: findError } = await supabaseServer
      .from(TABLE)
      .select("*")
      .ilike("name", cleanName)
      .maybeSingle();

    if (findError && findError.code !== "PGRST116") {
      throw new Error(findError.message);
    }

    if (existing) {
      return { success: true, tag: existing as Tag, isExisting: true };
    }

    // Insert new tag
    const { data: inserted, error: insertError } = await supabaseServer
      .from(TABLE)
      .insert({
        name: cleanName,
        color: cleanColor,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Handle potential race condition on unique constraint
      if (insertError.code === "23505") {
        const { data: raceFound } = await supabaseServer.from(TABLE).select("*").ilike("name", cleanName).maybeSingle();
        if (raceFound) {
          return { success: true, tag: raceFound as Tag, isExisting: true };
        }
      }
      throw new Error(insertError.message);
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/people-tags");
    revalidatePath("/dashboard/crm/people");

    return { success: true, tag: inserted as Tag, isExisting: false };
  } catch (error) {
    console.error("[createTag] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update an existing tag's name and color.
 */
export async function updateTag(id: string, data: { name: string; color?: string }) {
  try {
    const cleanName = (data.name || "").trim();
    const cleanColor = (data.color || "#64748B").trim();

    if (!cleanName) {
      return { success: false, error: "Tag name cannot be empty" };
    }

    // Fetch existing record
    const { data: current, error: currentError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (currentError || !current) {
      return { success: false, error: "Tag not found" };
    }

    // Check if new name is taken by another tag
    if (cleanName.toLowerCase() !== current.name.toLowerCase()) {
      const { data: duplicate } = await supabaseServer
        .from(TABLE)
        .select("id")
        .ilike("name", cleanName)
        .neq("id", id)
        .maybeSingle();

      if (duplicate) {
        return { success: false, error: `A tag named "${cleanName}" already exists.` };
      }
    }

    // Perform tag record update
    const { data: updated, error: updateError } = await supabaseServer
      .from(TABLE)
      .update({
        name: cleanName,
        color: cleanColor,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    // If tag name changed, update people who had the old tag name
    if (cleanName !== current.name) {
      const { data: peopleWithTag } = await supabaseServer
        .from("people")
        .select("id, tags")
        .contains("tags", JSON.stringify([current.name]));

      if (peopleWithTag && peopleWithTag.length > 0) {
        for (const p of peopleWithTag) {
          const currentTags = Array.isArray(p.tags) ? p.tags : [];
          const newTags = currentTags.map((t: string) =>
            t.toLowerCase() === current.name.toLowerCase() ? cleanName : t,
          );
          await supabaseServer.from("people").update({ tags: newTags }).eq("id", p.id);
        }
      }
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/people-tags");
    revalidatePath(`/dashboard/admin/people-tags/${id}`);
    revalidatePath("/dashboard/crm/people");

    return { success: true, tag: updated as Tag };
  } catch (error) {
    console.error("[updateTag] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete a tag if it is not linked to any people records.
 */
export async function deleteTag(id: string) {
  try {
    const { data: tag, error: tagError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (tagError || !tag) {
      return { success: false, error: "Tag not found" };
    }

    // Verify no people are linked to this tag
    const { count, error: countError } = await supabaseServer
      .from("people")
      .select("*", { count: "exact", head: true })
      .contains("tags", JSON.stringify([tag.name]));

    if (countError) throw new Error(countError.message);

    if (count && count > 0) {
      return {
        success: false,
        error: `Cannot delete tag "${tag.name}" because it is currently assigned to ${count} ${count === 1 ? "person" : "people"}.`,
      };
    }

    // Delete tag
    const { error: deleteError } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (deleteError) throw new Error(deleteError.message);

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/people-tags");
    revalidatePath("/dashboard/crm/people");

    return { success: true };
  } catch (error) {
    console.error("[deleteTag] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Ensure an array of tag names exist in the tags table.
 */
export async function ensureTagsExist(tagNames: string[]) {
  try {
    const cleanNames = Array.from(new Set((tagNames || []).map((t) => (t || "").trim()).filter(Boolean)));

    if (cleanNames.length === 0) return { success: true };

    for (const name of cleanNames) {
      await createTag(name);
    }

    return { success: true };
  } catch (error) {
    console.error("[ensureTagsExist] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
