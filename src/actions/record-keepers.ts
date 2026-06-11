"use server";

import { revalidatePath } from "next/cache";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabaseServer } from "@/lib/supabase.server";
import { type Person, type RecordKeeper, RecordKeeperSchema } from "@/types/crm";

const TABLE = "record_keepers";

export async function getRecordKeepers() {
  try {
    const { data: recordKeepers, error: rkError } = await supabaseServer.from(TABLE).select("*");

    if (rkError) throw new Error((rkError as { message: string }).message);
    if (!recordKeepers || recordKeepers.length === 0) return { success: true, recordKeepers: [] };

    // Fetch person and address details
    const personIds = Array.from(new Set(recordKeepers.flatMap((m) => m.personIds || [])));
    const addressIds = Array.from(new Set(recordKeepers.map((m) => m.firmAddressId).filter(Boolean))) as string[];

    const [peopleResult, addressesResult] = await Promise.all([
      personIds.length > 0
        ? supabaseServer.from("people").select("*").in("id", personIds)
        : Promise.resolve({ data: [] as never[], error: null as PostgrestError | null }),
      addressIds.length > 0
        ? supabaseServer.from("addresses").select("*").in("id", addressIds)
        : Promise.resolve({ data: [] as never[], error: null as PostgrestError | null }),
    ]);

    if (peopleResult.error) throw new Error(peopleResult.error.message);
    if (addressesResult.error) throw new Error(addressesResult.error.message);

    const people = peopleResult.data || [];
    const addresses = addressesResult.data || [];

    const peopleMap = people.reduce(
      (acc, person) => {
        acc[person.id] = person;
        return acc;
      },
      {} as Record<string, (typeof people)[number]>,
    );

    const addressMap = addresses.reduce(
      (acc, addr) => {
        acc[addr.id] = addr;
        return acc;
      },
      {} as Record<string, (typeof addresses)[number]>,
    );

    const recordKeepersWithDetails = recordKeepers.map((recordKeeper) => ({
      ...recordKeeper,
      people: ((recordKeeper.personIds as string[]) || []).map((id: string) => peopleMap[id]).filter(Boolean),
      address: recordKeeper.firmAddressId ? addressMap[recordKeeper.firmAddressId] : null,
    }));

    return { success: true, recordKeepers: recordKeepersWithDetails };
  } catch (error) {
    console.error(`[getRecordKeepers] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getRecordKeeper(id: string) {
  try {
    const { data: recordKeeper, error: rkError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (rkError) throw new Error((rkError as { message: string }).message);
    if (!recordKeeper) return { success: false, error: "Record Keeper not found" };

    // Fetch people details
    let people: Person[] = [];
    if (recordKeeper.personIds && recordKeeper.personIds.length > 0) {
      const { data: peopleData, error: peopleError } = await supabaseServer
        .from("people")
        .select("*")
        .in("id", recordKeeper.personIds);
      if (peopleError) throw new Error(peopleError.message);
      people = peopleData || [];
    }

    // Fetch address details
    let address = null;
    if (recordKeeper.firmAddressId) {
      const { data: addrData, error: addrError } = await supabaseServer
        .from("addresses")
        .select("*")
        .eq("id", recordKeeper.firmAddressId)
        .single();
      if (!addrError) {
        address = addrData;
      }
    }

    return { success: true, recordKeeper: recordKeeper as RecordKeeper, people, address };
  } catch (error) {
    console.error(`[getRecordKeeper] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createRecordKeeper(data: Partial<RecordKeeper>) {
  try {
    const validated = RecordKeeperSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/record-keepers");

    if (data.clientIds?.length) {
      data.clientIds.forEach((id) => {
        revalidatePath(`/dashboard/crm/clients/${id}`);
      });
    }

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createRecordKeeper] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateRecordKeeper(id: string, data: Partial<RecordKeeper>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/record-keepers");
    revalidatePath(`/dashboard/admin/record-keepers/${id}`);

    if (data.clientIds?.length) {
      data.clientIds.forEach((clientId) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[updateRecordKeeper] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteRecordKeeper(id: string) {
  try {
    const { data: recordKeeper, error: getError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (getError) throw new Error((getError as { message: string }).message);

    const { error: deleteError } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (deleteError) throw new Error((deleteError as { message: string }).message);

    revalidatePath("/dashboard/admin/record-keepers");

    if (recordKeeper?.clientIds?.length) {
      (recordKeeper.clientIds as string[]).forEach((clientId: string) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[deleteRecordKeeper] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
