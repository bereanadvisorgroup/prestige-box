"use server";

import { revalidatePath } from "next/cache";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabaseServer } from "@/lib/supabase.server";
import { type AccountingFirm, AccountingFirmSchema } from "@/types/crm";

const TABLE = "accounting_firms";

export async function getAccountingFirms() {
  try {
    const { data: accountingFirms, error: accountingFirmsError } = await supabaseServer.from(TABLE).select("*");

    if (accountingFirmsError) throw new Error((accountingFirmsError as { message: string }).message);
    if (!accountingFirms || accountingFirms.length === 0) return { success: true, accountingFirms: [] };

    // Fetch person and address details
    const personIds = Array.from(new Set(accountingFirms.flatMap((l) => l.personIds || [])));
    const addressIds = Array.from(new Set(accountingFirms.map((l) => l.firmAddressId).filter(Boolean))) as string[];

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

    const accountingFirmsWithDetails = accountingFirms.map((accountingFirm) => ({
      ...accountingFirm,
      people: ((accountingFirm.personIds as string[]) || []).map((id: string) => peopleMap[id]).filter(Boolean),
      address: accountingFirm.firmAddressId ? addressMap[accountingFirm.firmAddressId] : null,
    }));

    return { success: true, accountingFirms: accountingFirmsWithDetails };
  } catch (error) {
    console.error(`[getAccountingFirms] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getAccountingFirm(id: string) {
  try {
    const { data: accountingFirm, error: accountingFirmError } = await supabaseServer
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (accountingFirmError) throw new Error((accountingFirmError as { message: string }).message);
    if (!accountingFirm) return { success: false, error: "Accounting Firm not found" };

    // Fetch people details
    let people: any[] = [];
    if (accountingFirm.personIds && accountingFirm.personIds.length > 0) {
      const { data: peopleData, error: peopleError } = await supabaseServer
        .from("people")
        .select("*")
        .in("id", accountingFirm.personIds);
      if (peopleError) throw new Error(peopleError.message);
      people = peopleData || [];
    }

    // Fetch address details
    let address = null;
    if (accountingFirm.firmAddressId) {
      const { data: addrData, error: addrError } = await supabaseServer
        .from("addresses")
        .select("*")
        .eq("id", accountingFirm.firmAddressId)
        .single();
      if (!addrError) {
        address = addrData;
      }
    }

    return { success: true, accountingFirm: accountingFirm as AccountingFirm, people, address };
  } catch (error) {
    console.error(`[getAccountingFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createAccountingFirm(data: Partial<AccountingFirm>) {
  try {
    const validated = AccountingFirmSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/accounting-firms");

    if (data.clientIds?.length) {
      data.clientIds.forEach((id) => {
        revalidatePath(`/dashboard/crm/clients/${id}`);
      });
    }

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createAccountingFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateAccountingFirm(id: string, data: Partial<AccountingFirm>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/accounting-firms");
    revalidatePath(`/dashboard/crm/accounting-firms/${id}`);

    if (data.clientIds?.length) {
      data.clientIds.forEach((clientId) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[updateAccountingFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteAccountingFirm(id: string) {
  try {
    const { data: accountingFirm, error: getError } = await supabaseServer
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (getError) throw new Error((getError as { message: string }).message);

    const { error: deleteError } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (deleteError) throw new Error((deleteError as { message: string }).message);

    revalidatePath("/dashboard/crm/accounting-firms");

    if (accountingFirm?.clientIds?.length) {
      (accountingFirm.clientIds as string[]).forEach((clientId: string) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[deleteAccountingFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
