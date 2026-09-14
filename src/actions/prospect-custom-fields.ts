"use server";

import { revalidatePath } from "next/cache";

import { fetchAllRows } from "@/lib/fetch-chunks";
import { supabaseServer } from "@/lib/supabase.server";
import { type ProspectCustomField, ProspectCustomFieldSchema } from "@/types/prospects";

const TABLE = "prospect_custom_fields";

export async function getProspectCustomFields(): Promise<{
  success: boolean;
  fields?: ProspectCustomField[];
  error?: string;
}> {
  try {
    const raw = await fetchAllRows((from, to) =>
      supabaseServer.from(TABLE).select("*").order("sortOrder", { ascending: true }).range(from, to),
    );

    return { success: true, fields: (raw || []) as ProspectCustomField[] };
  } catch (error) {
    console.error("[getProspectCustomFields] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createProspectCustomField(data: Partial<ProspectCustomField>) {
  try {
    const sanitizedName = (data.name || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, "_");

    const validated = ProspectCustomFieldSchema.parse({
      ...data,
      name: sanitizedName,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/prospects");
    return { success: true, id: inserted.id };
  } catch (error) {
    console.error("[createProspectCustomField] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateProspectCustomField(id: string, data: Partial<ProspectCustomField>) {
  try {
    const { error } = await supabaseServer.from(TABLE).update(data).eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/prospects");
    return { success: true };
  } catch (error) {
    console.error("[updateProspectCustomField] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteProspectCustomField(id: string) {
  try {
    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/prospects");
    return { success: true };
  } catch (error) {
    console.error("[deleteProspectCustomField] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}
