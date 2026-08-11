"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser, supabaseServer } from "@/lib/supabase.server";
import { type Event, EventSchema } from "@/types/crm";

const TABLE = "events";

/**
 * Helper to verify that the current user is authenticated and has the admin role.
 */
async function verifyAdmin() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Unauthorized: Please sign in.");
  }

  const { data: dbUser, error: dbUserError } = await supabaseServer
    .from("users")
    .select("role")
    .eq("uid", user.id)
    .single();

  if (dbUserError || !dbUser || dbUser.role !== "admin") {
    throw new Error("Unauthorized: Admin role required.");
  }
}

/**
 * Fetch all events sorted by start date.
 */
export async function getEvents() {
  try {
    const { data: list, error } = await supabaseServer
      .from(TABLE)
      .select("*, address:addresses(*)")
      .order("startDate", { ascending: true });

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, events: (list || []) as Event[] };
  } catch (error) {
    console.error("[getEvents] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch a single event by ID.
 */
export async function getEvent(id: string) {
  try {
    const { data: record, error } = await supabaseServer
      .from(TABLE)
      .select("*, address:addresses(*)")
      .eq("id", id)
      .single();

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, event: record as (Event & { address?: Record<string, unknown> }) };
  } catch (error) {
    console.error("[getEvent] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Create a new event. Only allowed for admins.
 */
export async function createEvent(data: Partial<Event>) {
  try {
    await verifyAdmin();

    const validated = EventSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer
      .from(TABLE)
      .insert({
        title: validated.title,
        addressId: validated.addressId || null,
        startDate: validated.startDate || null,
        endDate: validated.endDate || null,
      })
      .select()
      .single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/events");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error("[createEvent] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update an existing event. Only allowed for admins.
 */
export async function updateEvent(id: string, data: Partial<Event>) {
  try {
    await verifyAdmin();

    const validated = EventSchema.parse({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    const { error } = await supabaseServer
      .from(TABLE)
      .update({
        title: validated.title,
        addressId: validated.addressId || null,
        startDate: validated.startDate || null,
        endDate: validated.endDate || null,
        updatedAt: validated.updatedAt,
      })
      .eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/events");
    revalidatePath(`/dashboard/admin/events/${id}`);

    return { success: true };
  } catch (error) {
    console.error("[updateEvent] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete an event. Only allowed for admins.
 */
export async function deleteEvent(id: string) {
  try {
    await verifyAdmin();

    // Check if linked by any client
    const { data: linkedClients, error: checkError } = await supabaseServer
      .from("clients")
      .select("id")
      .eq("referredByEventId", id)
      .limit(1);

    if (checkError) throw new Error((checkError as { message: string }).message);
    if (linkedClients && linkedClients.length > 0) {
      throw new Error("Cannot delete event: it is associated with a client referral.");
    }

    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/admin/events");

    return { success: true };
  } catch (error) {
    console.error("[deleteEvent] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
