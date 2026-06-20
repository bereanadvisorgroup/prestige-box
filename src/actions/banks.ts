"use server";

import { revalidatePath } from "next/cache";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabaseServer } from "@/lib/supabase.server";
import { type Bank, BankSchema, type Person } from "@/types/crm";

const TABLE = "banks";

export async function getBanks() {
  try {
    const { data: banks, error: banksError } = await supabaseServer.from(TABLE).select("*");

    if (banksError) throw new Error((banksError as { message: string }).message);
    if (!banks || banks.length === 0) return { success: true, banks: [] };

    // Fetch person and address details
    const personIds = Array.from(new Set(banks.flatMap((l) => l.personIds || [])));
    const addressIds = Array.from(new Set(banks.map((l) => l.firmAddressId).filter(Boolean))) as string[];

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

    const banksWithDetails = banks.map((bank) => ({
      ...bank,
      people: ((bank.personIds as string[]) || []).map((id: string) => peopleMap[id]).filter(Boolean),
      address: bank.firmAddressId ? addressMap[bank.firmAddressId] : null,
    }));

    return { success: true, banks: banksWithDetails };
  } catch (error) {
    console.error(`[getBanks] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getBank(id: string) {
  try {
    const { data: bank, error: bankError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (bankError) throw new Error((bankError as { message: string }).message);
    if (!bank) return { success: false, error: "Bank not found" };

    // Fetch people details
    let people: Person[] = [];
    if (bank.personIds && bank.personIds.length > 0) {
      const { data: peopleData, error: peopleError } = await supabaseServer
        .from("people")
        .select("*")
        .in("id", bank.personIds);
      if (peopleError) throw new Error(peopleError.message);
      people = peopleData || [];
    }

    // Fetch address details
    let address = null;
    if (bank.firmAddressId) {
      const { data: addrData, error: addrError } = await supabaseServer
        .from("addresses")
        .select("*")
        .eq("id", bank.firmAddressId)
        .single();
      if (!addrError) {
        address = addrData;
      }
    }

    return { success: true, bank: bank as Bank, people, address };
  } catch (error) {
    console.error(`[getBank] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createBank(data: Partial<Bank>) {
  try {
    const validated = BankSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/banks");

    if (data.clientIds?.length) {
      data.clientIds.forEach((id) => {
        revalidatePath(`/dashboard/crm/clients/${id}`);
      });
    }
    if (data.companyIds?.length) {
      data.companyIds.forEach((id) => {
        revalidatePath(`/dashboard/crm/companies/${id}`);
      });
    }

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createBank] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateBank(id: string, data: Partial<Bank>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/banks");
    revalidatePath(`/dashboard/crm/banks/${id}`);

    if (data.clientIds?.length) {
      data.clientIds.forEach((clientId) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }
    if (data.companyIds?.length) {
      data.companyIds.forEach((companyId) => {
        revalidatePath(`/dashboard/crm/companies/${companyId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[updateBank] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteBank(id: string) {
  try {
    const { data: bank, error: getError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (getError) throw new Error((getError as { message: string }).message);

    const { error: deleteError } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (deleteError) throw new Error((deleteError as { message: string }).message);

    revalidatePath("/dashboard/crm/banks");

    if (bank?.clientIds?.length) {
      (bank.clientIds as string[]).forEach((clientId: string) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }
    if (bank?.companyIds?.length) {
      (bank.companyIds as string[]).forEach((companyId: string) => {
        revalidatePath(`/dashboard/crm/companies/${companyId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[deleteBank] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function linkClientToBank(firmId: string, clientId: string) {
  try {
    const firmRes = await getBank(firmId);
    if (!firmRes.success || !firmRes.bank) return { success: false, error: "Bank not found" };

    const currentIds = firmRes.bank.clientIds || [];
    if (currentIds.includes(clientId)) return { success: true }; // already linked

    return updateBank(firmId, { clientIds: [...currentIds, clientId] });
  } catch (error) {
    console.error(`[linkClientToBank] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function unlinkClientFromBank(firmId: string, clientId: string) {
  try {
    const firmRes = await getBank(firmId);
    if (!firmRes.success || !firmRes.bank) return { success: false, error: "Bank not found" };

    const currentIds = firmRes.bank.clientIds || [];
    if (!currentIds.includes(clientId)) return { success: true }; // already unlinked

    return updateBank(firmId, { clientIds: currentIds.filter((id) => id !== clientId) });
  } catch (error) {
    console.error(`[unlinkClientFromBank] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
