"use server";

import { revalidatePath } from "next/cache";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabaseServer } from "@/lib/supabase.server";
import { type MoneyManager, MoneyManagerSchema, type Person } from "@/types/crm";

const TABLE = "money_managers";

export async function getMoneyManagers() {
  try {
    const { data: moneyManagers, error: mmError } = await supabaseServer.from(TABLE).select("*");

    if (mmError) throw new Error((mmError as { message: string }).message);
    if (!moneyManagers || moneyManagers.length === 0) return { success: true, moneyManagers: [] };

    // Fetch person and address details
    const personIds = Array.from(new Set(moneyManagers.flatMap((m) => m.personIds || [])));
    const addressIds = Array.from(new Set(moneyManagers.map((m) => m.firmAddressId).filter(Boolean))) as string[];

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

    const moneyManagersWithDetails = moneyManagers.map((moneyManager) => ({
      ...moneyManager,
      people: ((moneyManager.personIds as string[]) || []).map((id: string) => peopleMap[id]).filter(Boolean),
      address: moneyManager.firmAddressId ? addressMap[moneyManager.firmAddressId] : null,
    }));

    return { success: true, moneyManagers: moneyManagersWithDetails };
  } catch (error) {
    console.error(`[getMoneyManagers] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getMoneyManager(id: string) {
  try {
    const { data: moneyManager, error: mmError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (mmError) throw new Error((mmError as { message: string }).message);
    if (!moneyManager) return { success: false, error: "Money Manager not found" };

    // Fetch people details
    let people: Person[] = [];
    if (moneyManager.personIds && moneyManager.personIds.length > 0) {
      const { data: peopleData, error: peopleError } = await supabaseServer
        .from("people")
        .select("*")
        .in("id", moneyManager.personIds);
      if (peopleError) throw new Error(peopleError.message);
      people = peopleData || [];
    }

    // Fetch address details
    let address = null;
    if (moneyManager.firmAddressId) {
      const { data: addrData, error: addrError } = await supabaseServer
        .from("addresses")
        .select("*")
        .eq("id", moneyManager.firmAddressId)
        .single();
      if (!addrError) {
        address = addrData;
      }
    }

    return { success: true, moneyManager: moneyManager as MoneyManager, people, address };
  } catch (error) {
    console.error(`[getMoneyManager] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createMoneyManager(data: Partial<MoneyManager>) {
  try {
    const validated = MoneyManagerSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/money-managers");

    if (data.clientIds?.length) {
      data.clientIds.forEach((id) => {
        revalidatePath(`/dashboard/crm/clients/${id}`);
      });
    }

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createMoneyManager] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateMoneyManager(id: string, data: Partial<MoneyManager>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/money-managers");
    revalidatePath(`/dashboard/admin/money-managers/${id}`);

    if (data.clientIds?.length) {
      data.clientIds.forEach((clientId) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[updateMoneyManager] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteMoneyManager(id: string) {
  try {
    const { data: moneyManager, error: getError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (getError) throw new Error((getError as { message: string }).message);

    const { error: deleteError } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (deleteError) throw new Error((deleteError as { message: string }).message);

    revalidatePath("/dashboard/admin/money-managers");

    if (moneyManager?.clientIds?.length) {
      (moneyManager.clientIds as string[]).forEach((clientId: string) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[deleteMoneyManager] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
