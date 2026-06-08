"use server";

import { revalidatePath } from "next/cache";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabaseServer } from "@/lib/supabase.server";
import { type Lawyer, LawyerSchema } from "@/types/crm";

const TABLE = "lawyers";

export async function getLawyers() {
  try {
    const { data: lawyers, error: lawyersError } = await supabaseServer.from(TABLE).select("*");

    if (lawyersError) throw new Error((lawyersError as { message: string }).message);
    if (!lawyers || lawyers.length === 0) return { success: true, lawyers: [] };

    // Fetch person and address details
    const personIds = Array.from(new Set(lawyers.map((l) => l.personId)));
    const addressIds = Array.from(new Set(lawyers.map((l) => l.firmAddressId).filter(Boolean))) as string[];

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

    const lawyersWithDetails = lawyers.map((lawyer) => ({
      ...lawyer,
      person: peopleMap[lawyer.personId] || null,
      address: lawyer.firmAddressId ? addressMap[lawyer.firmAddressId] : null,
    }));

    return { success: true, lawyers: lawyersWithDetails };
  } catch (error) {
    console.error(`[getLawyers] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getLawyer(id: string) {
  try {
    const { data: lawyer, error: lawyerError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (lawyerError) throw new Error((lawyerError as { message: string }).message);
    if (!lawyer) return { success: false, error: "Lawyer not found" };

    // Fetch person details
    const { data: person, error: personError } = await supabaseServer
      .from("people")
      .select("*")
      .eq("id", lawyer.personId)
      .single();

    if (personError && personError.code !== "PGRST116") {
      throw new Error((personError as { message: string }).message);
    }

    // Fetch address details
    let address = null;
    if (lawyer.firmAddressId) {
      const { data: addrData, error: addrError } = await supabaseServer
        .from("addresses")
        .select("*")
        .eq("id", lawyer.firmAddressId)
        .single();
      if (!addrError) {
        address = addrData;
      }
    }

    return { success: true, lawyer: lawyer as Lawyer, person: person || null, address };
  } catch (error) {
    console.error(`[getLawyer] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createLawyer(data: Partial<Lawyer>) {
  try {
    const validated = LawyerSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/lawyers");

    if (data.clientIds?.length) {
      data.clientIds.forEach((id) => {
        revalidatePath(`/dashboard/crm/clients/${id}`);
      });
    }

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createLawyer] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateLawyer(id: string, data: Partial<Lawyer>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/lawyers");
    revalidatePath(`/dashboard/crm/lawyers/${id}`);

    if (data.clientIds?.length) {
      data.clientIds.forEach((clientId) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[updateLawyer] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteLawyer(id: string) {
  try {
    const { data: lawyer, error: getError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (getError) throw new Error((getError as { message: string }).message);

    const { error: deleteError } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (deleteError) throw new Error((deleteError as { message: string }).message);

    revalidatePath("/dashboard/crm/lawyers");

    if (lawyer?.clientIds?.length) {
      (lawyer.clientIds as string[]).forEach((clientId: string) => {
        revalidatePath(`/dashboard/crm/clients/${clientId}`);
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`[deleteLawyer] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
