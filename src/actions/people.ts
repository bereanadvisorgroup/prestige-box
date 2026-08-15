"use server";

import { revalidatePath } from "next/cache";

import { normalizePerson } from "@/lib/crm-normalize";
import { fetchAllRows } from "@/lib/fetch-chunks";
import { PERSON_PROFILE_FIELDS } from "@/lib/history/fields";
import { recordFieldDiffs } from "@/lib/history/record";
import { getNicknameVariants } from "@/lib/nicknames";
import { supabaseServer } from "@/lib/supabase.server";
import { type Person, PersonSchema } from "@/types/crm";

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

export interface DuplicatePersonMatch {
  id: string;
  prefix?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  photoUrl?: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  isExactMatch: boolean;
  matchedName: string;
  inputName: string;
}

export interface FindDuplicatePeopleParams {
  firstName?: string | null;
  lastName?: string | null;
  excludePersonId?: string | null;
}

export async function findDuplicatePeople({ firstName, lastName, excludePersonId }: FindDuplicatePeopleParams) {
  try {
    const cleanFirst = (firstName || "").trim();
    const cleanLast = (lastName || "").trim();

    if (!cleanFirst || !cleanLast || cleanFirst.length < 2 || cleanLast.length < 2) {
      return { success: true, duplicates: [] as DuplicatePersonMatch[] };
    }

    const firstVariants = new Set(getNicknameVariants(cleanFirst).map((v) => v.toLowerCase()));

    let query = supabaseServer
      .from(TABLE)
      .select("id, prefix, firstName, middleName, lastName, suffix, photoUrl, emails, phones")
      .ilike("lastName", cleanLast);

    if (excludePersonId) {
      query = query.neq("id", excludePersonId);
    }

    const { data: candidates, error } = await query;

    if (error) throw new Error((error as { message: string }).message);
    if (!candidates || candidates.length === 0) {
      return { success: true, duplicates: [] as DuplicatePersonMatch[] };
    }

    const duplicates: DuplicatePersonMatch[] = [];

    for (const raw of candidates) {
      const person = normalizePerson(raw);
      const candFirst = (person.firstName || "").trim().toLowerCase();
      const isExact = candFirst === cleanFirst.toLowerCase();
      const isNickMatch = firstVariants.has(candFirst);

      if (isExact || isNickMatch) {
        const emails = person.emails || [];
        const phones = person.phones || [];

        const primaryEmail = emails.find((e) => e.isPrimary)?.address || emails[0]?.address || null;
        const primaryPhone = phones.find((p) => p.isPrimary)?.number || phones[0]?.number || null;

        const personId = person.id || (raw as { id: string }).id;
        if (!personId) continue;

        duplicates.push({
          id: personId,
          prefix: person.prefix || null,
          firstName: person.firstName || "",
          middleName: person.middleName || null,
          lastName: person.lastName || "",
          suffix: person.suffix || null,
          photoUrl: person.photoUrl || null,
          primaryEmail,
          primaryPhone,
          isExactMatch: isExact,
          matchedName: person.firstName || "",
          inputName: cleanFirst,
        });
      }
    }

    return { success: true, duplicates };
  } catch (error) {
    console.error(`[findDuplicatePeople] Error:`, error);
    return { success: false, duplicates: [] as DuplicatePersonMatch[], error: (error as { message: string }).message };
  }
}
