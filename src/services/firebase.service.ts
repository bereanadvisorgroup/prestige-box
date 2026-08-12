import "server-only";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { serverDb } from "@/lib/firebase.server";

export const FirebaseService = {
  /**
   * Fetch records from a Firestore collection with optional filter column and value.
   */
  async getRecords<T>(
    collectionName: string,
    column?: string,
    value?: unknown,
  ): Promise<{ success: boolean; data?: T[]; error?: string }> {
    try {
      let q = query(collection(serverDb, collectionName));
      if (column && value !== undefined) {
        q = query(q, where(column, "==", value));
      }
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as T[];
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[FirebaseService.getRecords] Error fetching ${collectionName}:`, message);
      return { success: true, data: [] };
    }
  },

  /**
   * Fetch a single record by ID.
   */
  async getRecordById<T>(
    collectionName: string,
    id: string,
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const docRef = doc(serverDb, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return { success: false, error: "Record not found" };
      }
      const data = { id: docSnap.id, ...docSnap.data() } as T;
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[FirebaseService.getRecordById] Error fetching ${collectionName} item ${id}:`, message);
      return { success: false, error: message };
    }
  },

  /**
   * Insert a record into a collection.
   */
  async insertRecord<T>(
    collectionName: string,
    payload: Record<string, unknown>,
    customId?: string,
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const targetId = customId || crypto.randomUUID();
      const docRef = doc(serverDb, collectionName, targetId);
      const recordData = { ...payload, id: targetId };
      await setDoc(docRef, recordData);
      return { success: true, data: recordData as T };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[FirebaseService.insertRecord] Error inserting into ${collectionName}:`, message);
      return { success: false, error: message };
    }
  },

  /**
   * Administrative insert/update.
   */
  async adminInsertRecord<T>(
    collectionName: string,
    payload: Record<string, unknown>,
    customId?: string,
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    return FirebaseService.insertRecord<T>(collectionName, payload, customId);
  },

  /**
   * Update a record in a collection.
   */
  async updateRecord(
    collectionName: string,
    id: string,
    payload: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(serverDb, collectionName, id);
      await updateDoc(docRef, payload);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[FirebaseService.updateRecord] Error updating ${collectionName} ${id}:`, message);
      return { success: false, error: message };
    }
  },

  /**
   * Delete a record from a collection.
   */
  async deleteRecord(collectionName: string, id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(serverDb, collectionName, id);
      await deleteDoc(docRef);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[FirebaseService.deleteRecord] Error deleting ${collectionName} ${id}:`, message);
      return { success: false, error: message };
    }
  },
};
