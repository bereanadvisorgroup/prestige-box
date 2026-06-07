"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";
import { type Address, AddressSchema } from "@/types/crm";

const TABLE = "addresses";

export async function getAddresses() {
  try {
    const { data: addresses, error } = await supabaseServer
      .from(TABLE)
      .select("*")
      .order("street1", { ascending: true });

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, addresses: addresses as Address[] };
  } catch (error) {
    console.error(`[getAddresses] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getAddress(id: string) {
  try {
    const { data: address, error } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (error) throw new Error((error as { message: string }).message);
    if (!address) return { success: false, error: "Address not found" };

    return { success: true, address: address as Address };
  } catch (error) {
    console.error(`[getAddress] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createAddress(data: Partial<Address>) {
  try {
    const validated = AddressSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/addresses");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createAddress] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateAddress(id: string, data: Partial<Address>) {
  try {
    const updateData = {
      ...data,
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/addresses");
    revalidatePath(`/dashboard/crm/addresses/${id}`);

    return { success: true };
  } catch (error) {
    console.error(`[updateAddress] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteAddress(id: string) {
  try {
    // Check if any people are linked to this address
    const { data: people, error: checkError } = await supabaseServer
      .from("people")
      .select("id")
      .contains("addressIds", [id])
      .limit(1);

    if (checkError) throw new Error((checkError as { message: string }).message);
    if (people && people.length > 0) {
      throw new Error("Cannot delete address that is linked to people");
    }

    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/addresses", "page");
    revalidatePath("/dashboard/crm/addresses", "layout");

    return { success: true };
  } catch (error) {
    console.error(`[deleteAddress] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getAddressPeople(id: string) {
  try {
    const { data: people, error } = await supabaseServer.from("people").select("*").contains("addressIds", [id]);

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, people };
  } catch (error) {
    console.error(`[getAddressPeople] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
