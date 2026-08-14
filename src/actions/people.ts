"use server";

import { revalidatePath } from "next/cache";

import { PERSON_PROFILE_FIELDS } from "@/lib/history/fields";
import { recordFieldDiffs } from "@/lib/history/record";
import { supabaseServer } from "@/lib/supabase.server";
import { type Person, PersonSchema } from "@/types/crm";

import { fetchAllRows } from "@/lib/fetch-chunks";
import { normalizePerson } from "@/lib/crm-normalize";
import { syncBirthdayForPerson } from "./task-sync";

const TABLE = "people";

export async function getPeople() {
  try {
    const people = await fetchAllRows((from, to) =>
      supabaseServer.from(TABLE).select("*").order("lastName", { ascending: true }).range(from, to),
    );

    const formattedPeople = (people || []).map(normalizePerson);

    return { success: true, people: formattedPeople as Person[] };
  } catch (error) {
    console.error(`[getPeople] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getPerson(id: string) {
  try {
    const { data: person, error } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (error) throw new Error((error as { message: string }).message);
    if (!person) return { success: false, error: "Person not found" };

    return { success: true, person: normalizePerson(person) as Person };
  } catch (error) {
    console.error(`[getPerson] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createPerson(data: Partial<Person>) {
  try {
    const validated = PersonSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/people");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createPerson] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updatePerson(id: string, data: Partial<Person>) {
  try {
    // Fetch current state to diff into history (attributed to the client, if any).
    const { data: current } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    // A person's profile change is recorded on the client record that links to them.
    if (current) {
      const { data: client } = await supabaseServer.from("clients").select("id").eq("personId", id).maybeSingle();
      if (client) {
        await recordFieldDiffs({
          entityType: "client",
          entityId: client.id,
          subType: "Profile",
          before: current,
          after: { ...current, ...data },
          fields: PERSON_PROFILE_FIELDS,
        });
      }
    }

    // Keep the auto-generated birthday task in sync with this person's birthDate.
    await syncBirthdayForPerson(id);

    revalidatePath("/dashboard/crm/people");
    revalidatePath(`/dashboard/crm/people/${id}`);

    return { success: true };
  } catch (error) {
    console.error(`[updatePerson] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deletePerson(id: string) {
  try {
    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/people");

    return { success: true };
  } catch (error) {
    console.error(`[deletePerson] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
