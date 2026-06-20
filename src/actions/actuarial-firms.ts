"use server";

import { revalidatePath } from "next/cache";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabaseServer } from "@/lib/supabase.server";
import { type ActuarialFirm, ActuarialFirmSchema, type Person } from "@/types/crm";

const TABLE = "actuarial_firms";

export async function getActuarialFirms() {
  try {
    const { data: actuarialFirms, error: actuarialFirmsError } = await supabaseServer.from(TABLE).select("*");

    if (actuarialFirmsError) throw new Error((actuarialFirmsError as { message: string }).message);
    if (!actuarialFirms || actuarialFirms.length === 0) return { success: true, actuarialFirms: [] };

    // Fetch person and address details
    const personIds = Array.from(new Set(actuarialFirms.flatMap((l) => l.personIds || [])));
    const addressIds = Array.from(new Set(actuarialFirms.map((l) => l.firmAddressId).filter(Boolean))) as string[];

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

    const actuarialFirmsWithDetails = actuarialFirms.map((actuarialFirm) => ({
      ...actuarialFirm,
      people: ((actuarialFirm.personIds as string[]) || []).map((id: string) => peopleMap[id]).filter(Boolean),
      address: actuarialFirm.firmAddressId ? addressMap[actuarialFirm.firmAddressId] : null,
    }));

    return { success: true, actuarialFirms: actuarialFirmsWithDetails };
  } catch (error) {
    console.error(`[getActuarialFirms] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getActuarialFirm(id: string) {
  try {
    const { data: actuarialFirm, error: actuarialFirmError } = await supabaseServer
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (actuarialFirmError) throw new Error((actuarialFirmError as { message: string }).message);
    if (!actuarialFirm) return { success: false, error: "Actuarial Firm not found" };

    // Fetch people details
    let people: Person[] = [];
    if (actuarialFirm.personIds && actuarialFirm.personIds.length > 0) {
      const { data: peopleData, error: peopleError } = await supabaseServer
        .from("people")
        .select("*")
        .in("id", actuarialFirm.personIds);
      if (peopleError) throw new Error(peopleError.message);
      people = peopleData || [];
    }

    // Fetch address details
    let address = null;
    if (actuarialFirm.firmAddressId) {
      const { data: addrData, error: addrError } = await supabaseServer
        .from("addresses")
        .select("*")
        .eq("id", actuarialFirm.firmAddressId)
        .single();
      if (!addrError) {
        address = addrData;
      }
    }

    return { success: true, actuarialFirm: actuarialFirm as ActuarialFirm, people, address };
  } catch (error) {
    console.error(`[getActuarialFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createActuarialFirm(data: Partial<ActuarialFirm>) {
  try {
    const validated = ActuarialFirmSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/actuarial-firms");

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
    console.error(`[createActuarialFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateActuarialFirm(id: string, data: Partial<ActuarialFirm>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/actuarial-firms");
    revalidatePath(`/dashboard/crm/actuarial-firms/${id}`);

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
    console.error(`[updateActuarialFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteActuarialFirm(id: string) {
  try {
    const { data: actuarialFirm, error: getError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (getError) throw new Error((getError as { message: string }).message);

    const { error: deleteError } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (deleteError) throw new Error((deleteError as { message: string }).message);

    revalidatePath("/dashboard/crm/actuarial-firms");

    if (actuarialFirm?.clientIds?.length) {
      (actuarialFirm.clientIds as string[]).forEach((clientId: string) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }
    if (actuarialFirm?.companyIds?.length) {
      (actuarialFirm.companyIds as string[]).forEach((companyId: string) => {
        revalidatePath(`/dashboard/crm/companies/${companyId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[deleteActuarialFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function linkClientToActuarialFirm(firmId: string, clientId: string) {
  try {
    const firmRes = await getActuarialFirm(firmId);
    if (!firmRes.success || !firmRes.actuarialFirm) return { success: false, error: "Firm not found" };

    const currentIds = firmRes.actuarialFirm.clientIds || [];
    if (currentIds.includes(clientId)) return { success: true }; // already linked

    return updateActuarialFirm(firmId, { clientIds: [...currentIds, clientId] });
  } catch (error) {
    console.error(`[linkClientToActuarialFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function unlinkClientFromActuarialFirm(firmId: string, clientId: string) {
  try {
    const firmRes = await getActuarialFirm(firmId);
    if (!firmRes.success || !firmRes.actuarialFirm) return { success: false, error: "Firm not found" };

    const currentIds = firmRes.actuarialFirm.clientIds || [];
    if (!currentIds.includes(clientId)) return { success: true }; // already unlinked

    return updateActuarialFirm(firmId, { clientIds: currentIds.filter((id) => id !== clientId) });
  } catch (error) {
    console.error(`[unlinkClientFromActuarialFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
