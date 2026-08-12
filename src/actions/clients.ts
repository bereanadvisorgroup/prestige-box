"use server";

import { revalidatePath } from "next/cache";

import { CLIENT_PROFILE_FIELDS } from "@/lib/history/fields";
import { recordEvent, recordFieldDiffs } from "@/lib/history/record";
import { FirebaseService } from "@/services/firebase.service";
import { type Client, ClientSchema, type Person } from "@/types/crm";

import { removeAutoTask, syncAnniversaryForClient, syncBirthdayForPerson } from "./task-sync";

const TABLE = "clients";

export async function getClients() {
  try {
    const res = await FirebaseService.getRecords<Client>(TABLE);
    if (!res.success || !res.data) return { success: true, clients: [] };
    const clients = res.data;

    const personIds = Array.from(new Set(clients.map((c) => c.personId).filter(Boolean)));
    if (personIds.length === 0) return { success: true, clients: [] };

    const peopleRes = await FirebaseService.getRecords<Person>("people");
    const people = peopleRes.data || [];
    const peopleMap = people.reduce(
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
    const clientRes = await FirebaseService.getRecordById<Client>(TABLE, id);
    if (!clientRes.success || !clientRes.data) return { success: false, error: "Client not found" };
    const client = clientRes.data;

    let person = null;
    if (client.personId) {
      const personRes = await FirebaseService.getRecordById("people", client.personId);
      if (personRes.success) person = personRes.data;
    }

    return { success: true, client, person };
  } catch (error) {
    console.error(`[getClient] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createClient(data: Partial<Client>) {
  try {
    const existing = await FirebaseService.getRecords<Client>(TABLE, "personId", data.personId);
    if (existing.success && existing.data && existing.data.length > 0) {
      throw new Error("A client record already exists for this person");
    }

    const validated = ClientSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const inserted = await FirebaseService.insertRecord<Client>(TABLE, validated as Record<string, unknown>);
    if (!inserted.success || !inserted.data) throw new Error(inserted.error || "Failed to create client");

    const clientId = inserted.data.id;

    await recordEvent({
      entityType: "client",
      entityId: clientId,
      subType: "Profile",
      action: "created",
      summary: "Client created",
    });

    if (data.personId) await syncBirthdayForPerson(data.personId);
    await syncAnniversaryForClient(clientId);

    revalidatePath("/dashboard/crm/clients");

    return { success: true, id: clientId };
  } catch (error) {
    console.error(`[createClient] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateClient(id: string, data: Partial<Client>) {
  try {
    const currentRes = await FirebaseService.getRecordById<Client>(TABLE, id);
    const current = currentRes.data;

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const res = await FirebaseService.updateRecord(TABLE, id, updateData);
    if (!res.success) throw new Error(res.error || "Failed to update client");

    await recordFieldDiffs({
      entityType: "client",
      entityId: id,
      subType: "Profile",
      before: current,
      after: { ...current, ...data },
      fields: CLIENT_PROFILE_FIELDS,
    });

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
    const existingRes = await FirebaseService.getRecordById<Client>(TABLE, id);
    const existing = existingRes.data;

    const res = await FirebaseService.deleteRecord(TABLE, id);
    if (!res.success) throw new Error(res.error || "Failed to delete client");

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
    const collections = [
      "law_firms",
      "accounting_firms",
      "insurance_agencies",
      "actuarial_firms",
      "banks",
      "property_and_casualty_firms",
      "money_managers",
      "record_keepers",
      "life_insurance_companies",
      "disability_insurance_companies",
      "long_term_care_insurance",
    ];

    const results = await Promise.all(
      collections.map((col) => FirebaseService.getRecords<{ clientIds?: string[] }>(col)),
    );

    const filterByIds = (list: { clientIds?: string[] | null }[]) =>
      list.filter((item) => item.clientIds?.includes(clientId)).length;

    return {
      success: true,
      counts: {
        lawFirms: filterByIds(results[0].data || []),
        accountingFirms: filterByIds(results[1].data || []),
        insuranceAgencies: filterByIds(results[2].data || []),
        actuarialFirms: filterByIds(results[3].data || []),
        banks: filterByIds(results[4].data || []),
        propertyAndCasualty: filterByIds(results[5].data || []),
        moneyManagers: filterByIds(results[6].data || []),
        recordKeepers: filterByIds(results[7].data || []),
        lifeInsurance: filterByIds(results[8].data || []),
        disabilityInsurance: filterByIds(results[9].data || []),
        longTermCare: filterByIds(results[10].data || []),
      },
    };
  } catch (error) {
    console.error("Error fetching association counts", error);
    return { success: false, error: (error as Error).message };
  }
}
