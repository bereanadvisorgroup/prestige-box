"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";
import type { Tag } from "@/types/crm";

const TABLE = "tags";

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
 * Create a new tag if it does not already exist (case-insensitive check).
 */
export async function createTag(name: string) {
  try {
    const cleanName = (name || "").trim();
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
      .insert({ name: cleanName })
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

    revalidatePath("/dashboard/crm/people");

    return { success: true, tag: inserted as Tag, isExisting: false };
  } catch (error) {
    console.error("[createTag] Error:", error);
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
