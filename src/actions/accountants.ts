"use server";

import { revalidatePath } from "next/cache";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabaseServer } from "@/lib/supabase.server";
import { type Accountant, AccountantSchema } from "@/types/crm";

const TABLE = "accountants";

export async function getAccountants() {
  try {
    const { data: accountants, error: accountantsError } = await supabaseServer.from(TABLE).select("*");

    if (accountantsError) throw new Error((accountantsError as { message: string }).message);
    if (!accountants || accountants.length === 0) return { success: true, accountants: [] };

    // Fetch person and address details
    const personIds = Array.from(new Set(accountants.map((a) => a.personId)));
    const addressIds = Array.from(new Set(accountants.map((a) => a.firmAddressId).filter(Boolean))) as string[];

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

    const accountantsWithDetails = accountants.map((accountant) => ({
      ...accountant,
      person: peopleMap[accountant.personId] || null,
      address: accountant.firmAddressId ? addressMap[accountant.firmAddressId] : null,
    }));

    return { success: true, accountants: accountantsWithDetails };
  } catch (error) {
    console.error(`[getAccountants] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getAccountant(id: string) {
  try {
    const { data: accountant, error: accountantError } = await supabaseServer
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (accountantError) throw new Error((accountantError as { message: string }).message);
    if (!accountant) return { success: false, error: "Accountant not found" };

    // Fetch person details
    const { data: person, error: personError } = await supabaseServer
      .from("people")
      .select("*")
      .eq("id", accountant.personId)
      .single();

    if (personError && personError.code !== "PGRST116") {
      throw new Error((personError as { message: string }).message);
    }

    // Fetch address details
    let address = null;
    if (accountant.firmAddressId) {
      const { data: addrData, error: addrError } = await supabaseServer
        .from("addresses")
        .select("*")
        .eq("id", accountant.firmAddressId)
        .single();
      if (!addrError) {
        address = addrData;
      }
    }

    return { success: true, accountant: accountant as Accountant, person: person || null, address };
  } catch (error) {
    console.error(`[getAccountant] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createAccountant(data: Partial<Accountant>) {
  try {
    const validated = AccountantSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/accountants");

    if (data.clientIds?.length) {
      data.clientIds.forEach((id) => {
        revalidatePath(`/dashboard/crm/clients/${id}`);
      });
    }

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createAccountant] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateAccountant(id: string, data: Partial<Accountant>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/accountants");
    revalidatePath(`/dashboard/crm/accountants/${id}`);

    if (data.clientIds?.length) {
      data.clientIds.forEach((clientId) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[updateAccountant] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteAccountant(id: string) {
  try {
    const { data: accountant, error: getError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (getError) throw new Error((getError as { message: string }).message);

    const { error: deleteError } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (deleteError) throw new Error((deleteError as { message: string }).message);

    revalidatePath("/dashboard/crm/accountants");

    if (accountant?.clientIds?.length) {
      (accountant.clientIds as string[]).forEach((clientId: string) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[deleteAccountant] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
