"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";
import { type Household, HouseholdSchema, type Person } from "@/types/crm";

const TABLE = "households";

export async function getHouseholds() {
  try {
    const { data: households, error } = await supabaseServer.from(TABLE).select("*").order("name", { ascending: true });

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, households: households as Household[] };
  } catch (error) {
    console.error(`[getHouseholds] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getHousehold(id: string) {
  try {
    const { data: household, error: hError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (hError) throw new Error((hError as { message: string }).message);
    if (!household) return { success: false, error: "Household not found" };

    // Fetch details for address
    let address = null;
    if (household.addressId) {
      const { data: addrData, error: addrError } = await supabaseServer
        .from("addresses")
        .select("*")
        .eq("id", household.addressId)
        .single();
      if (!addrError) {
        address = addrData;
      }
    }

    // Fetch details for members
    let members: { person: Person | null; role: string }[] = [];
    if (household.memberIds && household.memberIds.length > 0) {
      const personIds = household.memberIds.map((m: { personId: string }) => m.personId);
      const { data: peopleData, error: peopleError } = await supabaseServer
        .from("people")
        .select("*")
        .in("id", personIds);

      if (!peopleError && peopleData) {
        const peopleMap = peopleData.reduce(
          (acc, person) => {
            acc[person.id] = person;
            return acc;
          },
          {} as Record<string, (typeof peopleData)[number]>,
        );

        members = household.memberIds.map((m: { personId: string; role: string }) => ({
          person: peopleMap[m.personId] || null,
          role: m.role,
        }));
      }
    }

    return { success: true, household: household as Household, address, members };
  } catch (error) {
    console.error(`[getHousehold] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createHousehold(data: Partial<Household>) {
  try {
    const validated = HouseholdSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/households");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createHousehold] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateHousehold(id: string, data: Partial<Household>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/households");
    revalidatePath(`/dashboard/crm/households/${id}`);

    return { success: true };
  } catch (error) {
    console.error(`[updateHousehold] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteHousehold(id: string) {
  try {
    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/households");

    return { success: true };
  } catch (error) {
    console.error(`[deleteHousehold] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
