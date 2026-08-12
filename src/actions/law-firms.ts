"use server";

import { revalidatePath } from "next/cache";

type PostgrestError = { message: string };

import { recordServiceLinkChanges } from "@/lib/history/service-links";
import { supabaseServer } from "@/lib/supabase.server";
import { type LawFirm, LawFirmSchema, type Person } from "@/types/crm";

const TABLE = "law_firms";

export async function getLawFirms() {
  try {
    const { data: lawFirms, error: lawFirmsError } = await supabaseServer.from(TABLE).select("*");

    if (lawFirmsError) throw new Error((lawFirmsError as { message: string }).message);
    if (!lawFirms || lawFirms.length === 0) return { success: true, lawFirms: [] };

    // Fetch person and address details
    const personIds = Array.from(new Set(lawFirms.flatMap((l) => l.personIds || [])));
    const addressIds = Array.from(new Set(lawFirms.map((l) => l.firmAddressId).filter(Boolean))) as string[];

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

    const lawFirmsWithDetails = lawFirms.map((lawFirm) => ({
      ...lawFirm,
      people: ((lawFirm.personIds as string[]) || []).map((id: string) => peopleMap[id]).filter(Boolean),
      address: lawFirm.firmAddressId ? addressMap[lawFirm.firmAddressId] : null,
    }));

    return { success: true, lawFirms: lawFirmsWithDetails };
  } catch (error) {
    console.error(`[getLawFirms] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getLawFirm(id: string) {
  try {
    const { data: lawFirm, error: lawFirmError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (lawFirmError) throw new Error((lawFirmError as { message: string }).message);
    if (!lawFirm) return { success: false, error: "Law Firm not found" };

    // Fetch people details
    let people: Person[] = [];
    if (lawFirm.personIds && lawFirm.personIds.length > 0) {
      const { data: peopleData, error: peopleError } = await supabaseServer
        .from("people")
        .select("*")
        .in("id", lawFirm.personIds);
      if (peopleError) throw new Error(peopleError.message);
      people = peopleData || [];
    }

    // Fetch address details
    let address = null;
    if (lawFirm.firmAddressId) {
      const { data: addrData, error: addrError } = await supabaseServer
        .from("addresses")
        .select("*")
        .eq("id", lawFirm.firmAddressId)
        .single();
      if (!addrError) {
        address = addrData;
      }
    }

    return { success: true, lawFirm: lawFirm as LawFirm, people, address };
  } catch (error) {
    console.error(`[getLawFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createLawFirm(data: Partial<LawFirm>) {
  try {
    const validated = LawFirmSchema.parse({
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

    revalidatePath("/dashboard/crm/law-firms");

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
    console.error(`[createLawFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateLawFirm(id: string, data: Partial<LawFirm>) {
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

    revalidatePath("/dashboard/crm/law-firms");
    revalidatePath(`/dashboard/crm/law-firms/${id}`);

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
    console.error(`[updateLawFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteLawFirm(id: string) {
  try {
    const { data: lawFirm, error: getError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

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

    revalidatePath("/dashboard/crm/law-firms");

    if (lawFirm?.clientIds?.length) {
      (lawFirm.clientIds as string[]).forEach((clientId: string) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }
    if (lawFirm?.companyIds?.length) {
      (lawFirm.companyIds as string[]).forEach((companyId: string) => {
        revalidatePath(`/dashboard/crm/companies/${companyId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[deleteLawFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function linkClientToLawFirm(firmId: string, clientId: string) {
  try {
    const firmRes = await getLawFirm(firmId);
    if (!firmRes.success || !firmRes.lawFirm) return { success: false, error: "Firm not found" };

    const currentIds = firmRes.lawFirm.clientIds || [];
    if (currentIds.includes(clientId)) return { success: true }; // already linked

    return updateLawFirm(firmId, { clientIds: [...currentIds, clientId] });
  } catch (error) {
    console.error(`[linkClientToLawFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function unlinkClientFromLawFirm(firmId: string, clientId: string) {
  try {
    const firmRes = await getLawFirm(firmId);
    if (!firmRes.success || !firmRes.lawFirm) return { success: false, error: "Firm not found" };

    const currentIds = firmRes.lawFirm.clientIds || [];
    if (!currentIds.includes(clientId)) return { success: true }; // already unlinked

    return updateLawFirm(firmId, { clientIds: currentIds.filter((id) => id !== clientId) });
  } catch (error) {
    console.error(`[unlinkClientFromLawFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function linkCompanyToLawFirm(firmId: string, companyId: string) {
  try {
    const firmRes = await getLawFirm(firmId);
    if (!firmRes.success || !firmRes.lawFirm) return { success: false, error: "Firm not found" };

    const currentIds = firmRes.lawFirm.companyIds || [];
    if (currentIds.includes(companyId)) return { success: true }; // already linked

    return updateLawFirm(firmId, { companyIds: [...currentIds, companyId] });
  } catch (error) {
    console.error(`[linkCompanyToLawFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function unlinkCompanyFromLawFirm(firmId: string, companyId: string) {
  try {
    const firmRes = await getLawFirm(firmId);
    if (!firmRes.success || !firmRes.lawFirm) return { success: false, error: "Firm not found" };

    const currentIds = firmRes.lawFirm.companyIds || [];
    if (!currentIds.includes(companyId)) return { success: true }; // already unlinked

    return updateLawFirm(firmId, { companyIds: currentIds.filter((id) => id !== companyId) });
  } catch (error) {
    console.error(`[unlinkCompanyFromLawFirm] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
