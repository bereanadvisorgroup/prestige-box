"use server";

import { revalidatePath } from "next/cache";

import type { PostgrestError } from "@supabase/supabase-js";

import { recordServiceLinkChanges } from "@/lib/history/service-links";
import { supabaseServer } from "@/lib/supabase.server";
import { type Person, type PropertyAndCasualtyFirm, PropertyAndCasualtyFirmSchema } from "@/types/crm";

const TABLE = "property_and_casualty_firms";

export async function getPropertyAndCasualtyFirms() {
  try {
    const { data: propertyAndCasualtyFirms, error: propertyAndCasualtyFirmsError } = await supabaseServer
      .from(TABLE)
      .select("*");

    if (propertyAndCasualtyFirmsError) throw new Error((propertyAndCasualtyFirmsError as { message: string }).message);
    if (!propertyAndCasualtyFirms || propertyAndCasualtyFirms.length === 0)
      return { success: true, propertyAndCasualtyFirms: [] };

    // Fetch person and address details
    const personIds = Array.from(new Set(propertyAndCasualtyFirms.flatMap((l) => l.personIds || [])));
    const addressIds = Array.from(
      new Set(propertyAndCasualtyFirms.map((l) => l.firmAddressId).filter(Boolean)),
    ) as string[];

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

    const propertyAndCasualtyFirmsWithDetails = propertyAndCasualtyFirms.map((propertyAndCasualtyFirm) => ({
      ...propertyAndCasualtyFirm,
      people: ((propertyAndCasualtyFirm.personIds as string[]) || [])
        .map((id: string) => peopleMap[id])
        .filter(Boolean),
      address: propertyAndCasualtyFirm.firmAddressId ? addressMap[propertyAndCasualtyFirm.firmAddressId] : null,
    }));

    return { success: true, propertyAndCasualtyFirms: propertyAndCasualtyFirmsWithDetails };
  } catch (error) {
    console.error(`[getPropertyAndCasualtyFirms] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getPropertyAndCasualtyFirm(id: string) {
  try {
    const { data: propertyAndCasualtyFirm, error: propertyAndCasualtyFirmError } = await supabaseServer
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (propertyAndCasualtyFirmError) throw new Error((propertyAndCasualtyFirmError as { message: string }).message);
    if (!propertyAndCasualtyFirm) return { success: false, error: "Property And Casualty Firm not found" };

    // Fetch people details
    let people: Person[] = [];
    if (propertyAndCasualtyFirm.personIds && propertyAndCasualtyFirm.personIds.length > 0) {
      const { data: peopleData, error: peopleError } = await supabaseServer
        .from("people")
        .select("*")
        .in("id", propertyAndCasualtyFirm.personIds);
      if (peopleError) throw new Error(peopleError.message);
      people = peopleData || [];
    }

    // Fetch address details
    let address = null;
    if (propertyAndCasualtyFirm.firmAddressId) {
      const { data: addrData, error: addrError } = await supabaseServer
        .from("addresses")
        .select("*")
        .eq("id", propertyAndCasualtyFirm.firmAddressId)
        .single();
      if (!addrError) {
        address = addrData;
      }
    }

    return {
      success: true,
      propertyAndCasualtyFirm: propertyAndCasualtyFirm as PropertyAndCasualtyFirm,
      people,
      address,
    };
  } catch (error) {
    console.error(`[getPropertyAndCasualtyFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createPropertyAndCasualtyFirm(data: Partial<PropertyAndCasualtyFirm>) {
  try {
    const validated = PropertyAndCasualtyFirmSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    await recordServiceLinkChanges({
      table: TABLE,
      firmName: (inserted as any).name ?? (inserted as any).firmName ?? "",
      before: null,
      after: { clientIds: inserted.clientIds, companyIds: inserted.companyIds },
      mode: "added",
    });

    revalidatePath("/dashboard/crm/property-and-casualty");

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
    console.error(`[createPropertyAndCasualtyFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updatePropertyAndCasualtyFirm(id: string, data: Partial<PropertyAndCasualtyFirm>) {
  try {
    const { data: historyBefore } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    await recordServiceLinkChanges({
      table: TABLE,
      firmName:
        (data as any).name ??
        (data as any).firmName ??
        (historyBefore as any)?.name ??
        (historyBefore as any)?.firmName ??
        "",
      before: { clientIds: historyBefore?.clientIds, companyIds: historyBefore?.companyIds },
      after: {
        clientIds: data.clientIds !== undefined ? data.clientIds : historyBefore?.clientIds,
        companyIds: data.companyIds !== undefined ? data.companyIds : historyBefore?.companyIds,
      },
    });

    revalidatePath("/dashboard/crm/property-and-casualty");
    revalidatePath(`/dashboard/crm/property-and-casualty/${id}`);

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
    console.error(`[updatePropertyAndCasualtyFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deletePropertyAndCasualtyFirm(id: string) {
  try {
    const { data: propertyAndCasualtyFirm, error: getError } = await supabaseServer
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (getError) throw new Error((getError as { message: string }).message);

    const { data: historyRemoved } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    const { error: deleteError } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (deleteError) throw new Error((deleteError as { message: string }).message);

    if (historyRemoved) {
      await recordServiceLinkChanges({
        table: TABLE,
        firmName: (historyRemoved as any).name ?? (historyRemoved as any).firmName ?? "",
        before: { clientIds: historyRemoved.clientIds, companyIds: historyRemoved.companyIds },
        after: {},
        mode: "removed",
      });
    }

    revalidatePath("/dashboard/crm/property-and-casualty");

    if (propertyAndCasualtyFirm?.clientIds?.length) {
      (propertyAndCasualtyFirm.clientIds as string[]).forEach((clientId: string) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }
    if (propertyAndCasualtyFirm?.companyIds?.length) {
      (propertyAndCasualtyFirm.companyIds as string[]).forEach((companyId: string) => {
        revalidatePath(`/dashboard/crm/companies/${companyId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[deletePropertyAndCasualtyFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function linkClientToPropertyAndCasualtyFirm(firmId: string, clientId: string) {
  try {
    const firmRes = await getPropertyAndCasualtyFirm(firmId);
    if (!firmRes.success || !firmRes.propertyAndCasualtyFirm) return { success: false, error: "Firm not found" };

    const currentIds = firmRes.propertyAndCasualtyFirm.clientIds || [];
    if (currentIds.includes(clientId)) return { success: true }; // already linked

    return updatePropertyAndCasualtyFirm(firmId, { clientIds: [...currentIds, clientId] });
  } catch (error) {
    console.error(`[linkClientToPropertyAndCasualtyFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function unlinkClientFromPropertyAndCasualtyFirm(firmId: string, clientId: string) {
  try {
    const firmRes = await getPropertyAndCasualtyFirm(firmId);
    if (!firmRes.success || !firmRes.propertyAndCasualtyFirm) return { success: false, error: "Firm not found" };

    const currentIds = firmRes.propertyAndCasualtyFirm.clientIds || [];
    if (!currentIds.includes(clientId)) return { success: true }; // already unlinked

    return updatePropertyAndCasualtyFirm(firmId, { clientIds: currentIds.filter((id) => id !== clientId) });
  } catch (error) {
    console.error(`[unlinkClientFromPropertyAndCasualtyFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function linkCompanyToPropertyAndCasualtyFirm(firmId: string, companyId: string) {
  try {
    const firmRes = await getPropertyAndCasualtyFirm(firmId);
    if (!firmRes.success || !firmRes.propertyAndCasualtyFirm) return { success: false, error: "Firm not found" };

    const currentIds = firmRes.propertyAndCasualtyFirm.companyIds || [];
    if (currentIds.includes(companyId)) return { success: true }; // already linked

    return updatePropertyAndCasualtyFirm(firmId, { companyIds: [...currentIds, companyId] });
  } catch (error) {
    console.error(`[linkCompanyToPropertyAndCasualtyFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function unlinkCompanyFromPropertyAndCasualtyFirm(firmId: string, companyId: string) {
  try {
    const firmRes = await getPropertyAndCasualtyFirm(firmId);
    if (!firmRes.success || !firmRes.propertyAndCasualtyFirm) return { success: false, error: "Firm not found" };

    const currentIds = firmRes.propertyAndCasualtyFirm.companyIds || [];
    if (!currentIds.includes(companyId)) return { success: true }; // already unlinked

    return updatePropertyAndCasualtyFirm(firmId, { companyIds: currentIds.filter((id) => id !== companyId) });
  } catch (error) {
    console.error(`[unlinkCompanyFromPropertyAndCasualtyFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
