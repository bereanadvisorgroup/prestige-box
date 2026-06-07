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
