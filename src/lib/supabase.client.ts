import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase.client";

class ClientFirestoreQueryBuilder {
  private colName: string;
  private filters: Array<{ field: string; op: any; val: any }> = [];
  private limitNum?: number;

  constructor(colName: string) {
    this.colName = colName;
  }

  select(_fields?: string) {
    return this;
  }

  eq(field: string, val: any) {
    this.filters.push({ field, op: "==", val });
    return this;
  }

  ilike(field: string, val: any) {
    this.filters.push({ field, op: "==", val: String(val).replace(/%/g, "").toLowerCase() });
    return this;
  }

  limit(n: number) {
    this.limitNum = n;
    return this;
  }

  async maybeSingle() {
    try {
      let q = query(collection(db, this.colName));
      for (const f of this.filters) {
        q = query(q, where(f.field, f.op, f.val));
      }
      if (this.limitNum) {
        q = query(q, limit(this.limitNum));
      }
      const snap = await getDocs(q);
      if (snap.empty) return { data: null, error: null };
      const d = snap.docs[0];
      return { data: { id: d.id, ...d.data() }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || String(err) } };
    }
  }

  async single() {
    return this.maybeSingle();
  }

  async update(payload: any) {
    const colName = this.colName;
    const filters = this.filters;
    return {
      eq: async (field: string, val: any) => {
        try {
          let q = query(collection(db, colName));
          for (const f of filters) {
            q = query(q, where(f.field, f.op, f.val));
          }
          q = query(q, where(field, "==", val));
          const snap = await getDocs(q);
          for (const d of snap.docs) {
            await updateDoc(doc(db, colName, d.id), payload);
          }
          return { data: null, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err?.message || String(err) } };
        }
      },
    };
  }
}

export const supabase: any = {
  from: (table: string) => new ClientFirestoreQueryBuilder(table),
  auth: {
    getSession: async () => ({ data: { session: auth.currentUser ? { user: auth.currentUser } : null } }),
    onAuthStateChange: (cb: any) => {
      const unsub = auth.onAuthStateChanged((user) => {
        cb(user ? "SIGNED_IN" : "SIGNED_OUT", user ? { user } : null);
      });
      return { data: { subscription: { unsubscribe: unsub } } };
    },
    signOut: async () => {
      await auth.signOut();
      return { error: null };
    },
    mfa: {
      getAuthenticatorAssuranceLevel: async () => ({
        data: { currentLevel: "aal1", nextLevel: "aal1" },
        error: null,
      }),
    },
    passkey: {
      list: async () => ({ data: [], error: null }),
    },
  },
};
