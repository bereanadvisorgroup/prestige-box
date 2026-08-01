import "server-only";

import { supabaseAdmin, supabaseServer } from "@/lib/supabase.server";

export class SupabaseService {
  /**
   * Fetch records from a table with optional filter column and value.
   */
  static async getRecords<T>(
    table: string,
    column?: string,
    value?: unknown,
  ): Promise<{ success: boolean; data?: T[]; error?: string }> {
    try {
      let query = supabaseServer.from(table).select("*");
      if (column && value !== undefined) {
        query = query.eq(column, value);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: (data ?? []) as T[] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SupabaseService.getRecords] Error fetching ${table}:`, message);
      return { success: false, error: message };
    }
  }

  /**
   * Fetch a single record by ID.
   */
  static async getRecordById<T>(table: string, id: string): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const { data, error } = await supabaseServer.from(table).select("*").eq("id", id).single();
      if (error) throw error;
      return { success: true, data: data as T };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SupabaseService.getRecordById] Error fetching ${table} item ${id}:`, message);
      return { success: false, error: message };
    }
  }

  /**
   * Insert a record into a table.
   */
  static async insertRecord<T>(
    table: string,
    payload: Record<string, unknown>,
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const { data, error } = await supabaseServer.from(table).insert(payload).select().single();
      if (error) throw error;
      return { success: true, data: data as T };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SupabaseService.insertRecord] Error inserting into ${table}:`, message);
      return { success: false, error: message };
    }
  }

  /**
   * Administrative insert/update using service role.
   */
  static async adminInsertRecord<T>(
    table: string,
    payload: Record<string, unknown>,
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const { data, error } = await supabaseAdmin.from(table).insert(payload).select().single();
      if (error) throw error;
      return { success: true, data: data as T };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SupabaseService.adminInsertRecord] Error in ${table}:`, message);
      return { success: false, error: message };
    }
  }
}
