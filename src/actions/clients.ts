"use server";

import { revalidatePath } from "next/cache";

import { CLIENT_PROFILE_FIELDS } from "@/lib/history/fields";
import { recordEvent, recordFieldDiffs } from "@/lib/history/record";
import { supabaseServer } from "@/lib/supabase.server";
import { type Client, ClientSchema } from "@/types/crm";

import { fetchAllRows } from "@/lib/fetch-chunks";
import { normalizeClient, normalizePerson } from "@/lib/crm-normalize";
import { removeAutoTask, syncAnniversaryForClient, syncBirthdayForPerson } from "./task-sync";

const TABLE = "clients";

export async function getClients() {
  try {
    const clients = await fetchAllRows((from, to) =>
      supabaseServer.from(TABLE).select("*").range(from, to),
    );

    if (!clients || clients.length === 0) return { success: true, clients: [] };

    const people = await fetchAllRows((from, to) =>
      supabaseServer.from("people").select("*").range(from, to),
    );

    const peopleMap = (people || []).reduce(
      (acc, person) => {
        acc[person.id] = normalizePerson(person);
        return acc;
      },
      {} as Record<string, (typeof people)[number]>,
    );

    const clientWithPeople = clients.map((client) => ({
      ...normalizeClient(client),
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

    return { success: true, client: normalizeClient(client) as Client, person: person ? normalizePerson(person) : null };
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

    await recordEvent({
      entityType: "client",
      entityId: inserted.id,
      subType: "Profile",
      action: "created",
      summary: "Client created",
    });

    // Seed auto-generated tasks now that this person is a client.
    await syncBirthdayForPerson(inserted.personId);
    await syncAnniversaryForClient(inserted.id);

    revalidatePath("/dashboard/crm/clients");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createClient] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateClient(id: string, data: Partial<Client>) {
  try {
    // Fetch the current record so we can diff changed fields into history.
    const { data: current } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    await recordFieldDiffs({
      entityType: "client",
      entityId: id,
      subType: "Profile",
      before: current,
      after: { ...current, ...data },
      fields: CLIENT_PROFILE_FIELDS,
    });

    // Re-sync auto tasks: advisor reassignment, marriageDate edits, etc.
    if (current?.personId) await syncBirthdayForPerson(current.personId);
    await syncAnniversaryForClient(id);

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
    // Capture personId before deletion so we can clean up the birthday auto task.
    const { data: existing } = await supabaseServer.from(TABLE).select("personId").eq("id", id).single();

    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    // Remove auto tasks anchored to this client.
    if (existing?.personId) await removeAutoTask("birthday", existing.personId);
    await removeAutoTask("anniversary", id);

    await recordEvent({
      entityType: "client",
      entityId: id,
      subType: "Profile",
      action: "deleted",
      summary: "Client deleted",
    });

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
      lawFirmsRes,
      accountingFirmsRes,
      insuranceAgenciesRes,
      actuarialFirmsRes,
      banksRes,
      propertyAndCasualtyRes,
      moneyManagersRes,
      recordKeepersRes,
      lifeRes,
      disabilityRes,
      ltcRes,
    ] = await Promise.all([
      supabaseServer.from("law_firms").select("id, clientIds"),
      supabaseServer.from("accounting_firms").select("id, clientIds"),
      supabaseServer.from("insurance_agencies").select("id, clientIds"),
      supabaseServer.from("actuarial_firms").select("id, clientIds"),
      supabaseServer.from("banks").select("id, clientIds"),
      supabaseServer.from("property_and_casualty_firms").select("id, clientIds"),
      supabaseServer.from("money_managers").select("id, clientIds"),
      supabaseServer.from("record_keepers").select("id, clientIds"),
      supabaseServer.from("life_insurance_companies").select("id, clientIds"),
      supabaseServer.from("disability_insurance_companies").select("id, clientIds"),
      supabaseServer.from("long_term_care_insurance").select("id, clientIds"),
    ]);

    const filterByIds = (list: { clientIds?: string[] | null }[]) =>
      list.filter((item) => item.clientIds?.includes(clientId)).length;

    return {
      success: true,
      counts: {
        accountingFirms: filterByIds(accountingFirmsRes.data || []),
        insuranceAgencies: filterByIds(insuranceAgenciesRes.data || []),
        actuarialFirms: filterByIds(actuarialFirmsRes.data || []),
        banks: filterByIds(banksRes.data || []),
        lawFirms: filterByIds(lawFirmsRes.data || []),
        propertyAndCasualty: filterByIds(propertyAndCasualtyRes.data || []),
        moneyManagers: filterByIds(moneyManagersRes.data || []),
        recordKeepers: filterByIds(recordKeepersRes.data || []),
        lifeInsurance: filterByIds(lifeRes.data || []),
        disabilityInsurance: filterByIds(disabilityRes.data || []),
        longTermCare: filterByIds(ltcRes.data || []),
      },
    };
  } catch (error) {
    console.error("Error fetching association counts", error);
    return { success: false, error: (error as Error).message };
  }
}
