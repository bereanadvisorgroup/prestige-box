"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";
import { type Client, ClientSchema } from "@/types/crm";

const TABLE = "clients";

export async function getClients() {
  try {
    const { data: clients, error: clientsError } = await supabaseServer.from(TABLE).select("*");

    if (clientsError) throw new Error((clientsError as { message: string }).message);
    if (!clients || clients.length === 0) return { success: true, clients: [] };

    // Fetch person details for each client
    const personIds = Array.from(new Set(clients.map((c) => c.personId)));
    if (personIds.length === 0) return { success: true, clients: [] };

    const { data: people, error: peopleError } = await supabaseServer.from("people").select("*").in("id", personIds);

    if (peopleError) throw new Error((peopleError as { message: string }).message);

    const peopleMap = (people || []).reduce(
      (acc, person) => {
        acc[person.id] = person;
        return acc;
      },
      {} as Record<string, (typeof people)[number]>,
    );

    const clientWithPeople = clients.map((client) => ({
      ...client,
      person: peopleMap[client.personId] || null,
    }));

    clientWithPeople.sort((a, b) => {
      const nameA = `${a.person?.firstName || ""} ${a.person?.lastName || ""}`.trim().toLowerCase();
      const nameB = `${b.person?.firstName || ""} ${b.person?.lastName || ""}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return { success: true, clients: clientWithPeople };
  } catch (error) {
    console.error(`[getClients] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getClient(id: string) {
  try {
    const { data: client, error: clientError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (clientError) throw new Error((clientError as { message: string }).message);
    if (!client) return { success: false, error: "Client not found" };

    // Fetch person details
    const { data: person, error: personError } = await supabaseServer
      .from("people")
      .select("*")
      .eq("id", client.personId)
      .single();

    if (personError && personError.code !== "PGRST116") {
      throw new Error((personError as { message: string }).message);
    }

    return { success: true, client: client as Client, person: person || null };
  } catch (error) {
    console.error(`[getClient] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createClient(data: Partial<Client>) {
  try {
    // Check if client for this person already exists
    const { data: existing, error: checkError } = await supabaseServer
      .from(TABLE)
      .select("id")
      .eq("personId", data.personId)
      .limit(1);

    if (checkError) throw new Error((checkError as { message: string }).message);
    if (existing && existing.length > 0) {
      throw new Error("A client record already exists for this person");
    }

    const validated = ClientSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error: insertError } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (insertError) throw new Error((insertError as { message: string }).message);

    revalidatePath("/dashboard/crm/clients");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createClient] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateClient(id: string, data: Partial<Client>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/clients");
    revalidatePath(`/dashboard/crm/clients/${id}`);

    return { success: true };
  } catch (error) {
    console.error(`[updateClient] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteClient(id: string) {
  try {
    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/clients");

    return { success: true };
  } catch (error) {
    console.error(`[deleteClient] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getClientAssociationCounts(clientId: string) {
  try {
    const [
      policiesRes,
      lawFirmsRes,
      accountingFirmsRes,
      actuarialFirmsRes,
      banksRes,
      propertyAndCasualtyRes,
      moneyManagersRes,
      recordKeepersRes,
      lifeRes,
      disabilityRes,
      ltcRes,
    ] = await Promise.all([
      supabaseServer
        .from("client_policies")
        .select("lifeInsuranceCompanyId, disabilityInsuranceCompanyId, longTermCareInsuranceId")
        .eq("clientId", clientId),
      supabaseServer.from("law_firms").select("id, clientIds"),
      supabaseServer.from("accounting_firms").select("id, clientIds"),
      supabaseServer.from("actuarial_firms").select("id, clientIds"),
      supabaseServer.from("banks").select("id, clientIds"),
      supabaseServer.from("property_and_casualty_firms").select("id, clientIds"),
      supabaseServer.from("money_managers").select("id, clientIds"),
      supabaseServer.from("record_keepers").select("id, clientIds"),
      supabaseServer.from("life_insurance_companies").select("id"),
      supabaseServer.from("disability_insurance_companies").select("id"),
      supabaseServer.from("long_term_care_insurance").select("id"),
    ]);

    const policies = policiesRes.data || [];
    const policyLifeIds = new Set(policies.map((p) => p.lifeInsuranceCompanyId).filter(Boolean));
    const policyDisabilityIds = new Set(policies.map((p) => p.disabilityInsuranceCompanyId).filter(Boolean));
    const policyLtcIds = new Set(policies.map((p) => p.longTermCareInsuranceId).filter(Boolean));

    const filterByIds = (list: { clientIds?: string[] | null }[]) =>
      list.filter((item) => item.clientIds?.includes(clientId)).length;

    return {
      success: true,
      counts: {
        accountingFirms: filterByIds(accountingFirmsRes.data || []),
        actuarialFirms: filterByIds(actuarialFirmsRes.data || []),
        banks: filterByIds(banksRes.data || []),
        lawFirms: filterByIds(lawFirmsRes.data || []),
        propertyAndCasualty: filterByIds(propertyAndCasualtyRes.data || []),
        moneyManagers: filterByIds(moneyManagersRes.data || []),
        recordKeepers: filterByIds(recordKeepersRes.data || []),
        lifeInsurance: (lifeRes.data || []).filter((c) => policyLifeIds.has(c.id)).length,
        disabilityInsurance: (disabilityRes.data || []).filter((c) => policyDisabilityIds.has(c.id)).length,
        longTermCare: (ltcRes.data || []).filter((c) => policyLtcIds.has(c.id)).length,
      },
    };
  } catch (error) {
    console.error("Error fetching association counts", error);
    return { success: false, error: (error as Error).message };
  }
}
