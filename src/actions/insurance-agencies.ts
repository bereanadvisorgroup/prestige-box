"use server";

import { revalidatePath } from "next/cache";

type PostgrestError = { message: string };

import { recordServiceLinkChanges } from "@/lib/history/service-links";
import { supabaseServer } from "@/lib/supabase.server";
import { type InsuranceAgency, InsuranceAgencySchema, type Person } from "@/types/crm";

const TABLE = "insurance_agencies";

export async function getInsuranceAgencies() {
  try {
    const { data: insuranceAgencies, error: insuranceAgenciesError } = await supabaseServer.from(TABLE).select("*");

    if (insuranceAgenciesError) throw new Error((insuranceAgenciesError as { message: string }).message);
    if (!insuranceAgencies || insuranceAgencies.length === 0) return { success: true, insuranceAgencies: [] };

    // Fetch person and address details
    const personIds = Array.from(new Set(insuranceAgencies.flatMap((l) => l.personIds || [])));
    const addressIds = Array.from(new Set(insuranceAgencies.map((l) => l.firmAddressId).filter(Boolean))) as string[];

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

    const insuranceAgenciesWithDetails = insuranceAgencies.map((agency) => ({
      ...agency,
      people: ((agency.personIds as string[]) || []).map((id: string) => peopleMap[id]).filter(Boolean),
      address: agency.firmAddressId ? addressMap[agency.firmAddressId] : null,
    }));

    return { success: true, insuranceAgencies: insuranceAgenciesWithDetails };
  } catch (error) {
    console.error(`[getInsuranceAgencies] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getInsuranceAgency(id: string) {
  try {
    const { data: insuranceAgency, error: insuranceAgencyError } = await supabaseServer
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (insuranceAgencyError) throw new Error((insuranceAgencyError as { message: string }).message);
    if (!insuranceAgency) return { success: false, error: "Insurance Agency not found" };

    // Fetch people details
    let people: Person[] = [];
    if (insuranceAgency.personIds && insuranceAgency.personIds.length > 0) {
      const { data: peopleData, error: peopleError } = await supabaseServer
        .from("people")
        .select("*")
        .in("id", insuranceAgency.personIds);
      if (peopleError) throw new Error(peopleError.message);
      people = peopleData || [];
    }

    // Fetch address details
    let address = null;
    if (insuranceAgency.firmAddressId) {
      const { data: addrData, error: addrError } = await supabaseServer
        .from("addresses")
        .select("*")
        .eq("id", insuranceAgency.firmAddressId)
        .single();
      if (!addrError) {
        address = addrData;
      }
    }

    return { success: true, insuranceAgency: insuranceAgency as InsuranceAgency, people, address };
  } catch (error) {
    console.error(`[getInsuranceAgency] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createInsuranceAgency(data: Partial<InsuranceAgency>) {
  try {
    const validated = InsuranceAgencySchema.parse({
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

    revalidatePath("/dashboard/crm/insurance-agencies");

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
    console.error(`[createInsuranceAgency] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateInsuranceAgency(id: string, data: Partial<InsuranceAgency>) {
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

    revalidatePath("/dashboard/crm/insurance-agencies");
    revalidatePath(`/dashboard/crm/insurance-agencies/${id}`);

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
    console.error(`[updateInsuranceAgency] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteInsuranceAgency(id: string) {
  try {
    const { data: insuranceAgency, error: getError } = await supabaseServer
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

    revalidatePath("/dashboard/crm/insurance-agencies");

    if (insuranceAgency?.clientIds?.length) {
      (insuranceAgency.clientIds as string[]).forEach((clientId: string) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }
    if (insuranceAgency?.companyIds?.length) {
      (insuranceAgency.companyIds as string[]).forEach((companyId: string) => {
        revalidatePath(`/dashboard/crm/companies/${companyId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[deleteInsuranceAgency] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function linkClientToInsuranceAgency(firmId: string, clientId: string) {
  try {
    const firmRes = await getInsuranceAgency(firmId);
    if (!firmRes.success || !firmRes.insuranceAgency) return { success: false, error: "Agency not found" };

    const currentIds = firmRes.insuranceAgency.clientIds || [];
    if (currentIds.includes(clientId)) return { success: true };

    return updateInsuranceAgency(firmId, { clientIds: [...currentIds, clientId] });
  } catch (error) {
    console.error(`[linkClientToInsuranceAgency] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function unlinkClientFromInsuranceAgency(firmId: string, clientId: string) {
  try {
    const firmRes = await getInsuranceAgency(firmId);
    if (!firmRes.success || !firmRes.insuranceAgency) return { success: false, error: "Agency not found" };

    const currentIds = firmRes.insuranceAgency.clientIds || [];
    if (!currentIds.includes(clientId)) return { success: true };

    return updateInsuranceAgency(firmId, { clientIds: currentIds.filter((id) => id !== clientId) });
  } catch (error) {
    console.error(`[unlinkClientFromInsuranceAgency] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function linkCompanyToInsuranceAgency(firmId: string, companyId: string) {
  try {
    const firmRes = await getInsuranceAgency(firmId);
    if (!firmRes.success || !firmRes.insuranceAgency) return { success: false, error: "Agency not found" };

    const currentIds = firmRes.insuranceAgency.companyIds || [];
    if (currentIds.includes(companyId)) return { success: true };

    return updateInsuranceAgency(firmId, { companyIds: [...currentIds, companyId] });
  } catch (error) {
    console.error(`[linkCompanyToInsuranceAgency] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function unlinkCompanyFromInsuranceAgency(firmId: string, companyId: string) {
  try {
    const firmRes = await getInsuranceAgency(firmId);
    if (!firmRes.success || !firmRes.insuranceAgency) return { success: false, error: "Agency not found" };

    const currentIds = firmRes.insuranceAgency.companyIds || [];
    if (!currentIds.includes(companyId)) return { success: true };

    return updateInsuranceAgency(firmId, { companyIds: currentIds.filter((id) => id !== companyId) });
  } catch (error) {
    console.error(`[unlinkCompanyFromInsuranceAgency] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
