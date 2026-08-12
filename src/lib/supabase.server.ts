import "server-only";

import { cookies } from "next/headers";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { serverAuth, serverDb } from "@/lib/firebase.server";

class InsertBuilder {
  private colName: string;
  private payload: any;

  constructor(colName: string, payload: any) {
    this.colName = colName;
    this.payload = payload;
  }

  select(_fields?: string) {
    return this;
  }

  async single() {
    const res = await this.execute();
    const data = Array.isArray(res.data) ? res.data[0] : res.data;
    return { data, error: res.error };
  }

  async maybeSingle() {
    return this.single();
  }

  private async execute() {
    try {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted: any[] = [];
      for (const item of items) {
        const id = item.id || crypto.randomUUID();
        const data = { ...item, id };
        await setDoc(doc(serverDb, this.colName, id), data);
        inserted.push(data);
      }
      const result = Array.isArray(this.payload) ? inserted : inserted[0];
      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || String(err) } };
    }
  }

  async then(resolve: (res: any) => void, reject?: (err: any) => void) {
    try {
      const res = await this.execute();
      resolve(res);
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: { message: String(err) } });
    }
  }
}

class UpdateBuilder {
  private colName: string;
  private payload: any;
  private filters: Array<{ field: string; op: any; val: any }> = [];

  constructor(colName: string, payload: any, filters: Array<{ field: string; op: any; val: any }>) {
    this.colName = colName;
    this.payload = payload;
    this.filters = [...filters];
  }

  eq(field: string, val: any) {
    this.filters.push({ field, op: "==", val });
    return this;
  }

  select(_fields?: string) {
    return this;
  }

  async single() {
    const res = await this.execute();
    const data = Array.isArray(res.data) ? res.data[0] : res.data;
    return { data, error: res.error };
  }

  async maybeSingle() {
    return this.single();
  }

  private async execute() {
    try {
      let q = query(collection(serverDb, this.colName));
      for (const f of this.filters) {
        q = query(q, where(f.field, f.op, f.val));
      }
      const snap = await getDocs(q);
      const batch = writeBatch(serverDb);
      const updated: any[] = [];
      for (const docSnap of snap.docs) {
        const data = { ...docSnap.data(), ...this.payload };
        batch.update(docSnap.ref, this.payload);
        updated.push({ id: docSnap.id, ...data });
      }
      await batch.commit();
      return { data: updated, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || String(err) } };
    }
  }

  async then(resolve: (res: any) => void, reject?: (err: any) => void) {
    try {
      const res = await this.execute();
      resolve(res);
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: { message: String(err) } });
    }
  }
}

class DeleteBuilder {
  private colName: string;
  private filters: Array<{ field: string; op: any; val: any }> = [];

  constructor(colName: string, filters: Array<{ field: string; op: any; val: any }>) {
    this.colName = colName;
    this.filters = [...filters];
  }

  eq(field: string, val: any) {
    this.filters.push({ field, op: "==", val });
    return this;
  }

  select(_fields?: string) {
    return this;
  }

  private async execute() {
    try {
      let q = query(collection(serverDb, this.colName));
      for (const f of this.filters) {
        q = query(q, where(f.field, f.op, f.val));
      }
      const snap = await getDocs(q);
      const batch = writeBatch(serverDb);
      for (const docSnap of snap.docs) {
        batch.delete(docSnap.ref);
      }
      await batch.commit();
      return { data: null, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || String(err) } };
    }
  }

  async then(resolve: (res: any) => void, reject?: (err: any) => void) {
    try {
      const res = await this.execute();
      resolve(res);
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: { message: String(err) } });
    }
  }
}

class FirestoreQueryBuilder {
  private colName: string;
  private filters: Array<{ field: string; op: any; val: any }> = [];
  private orderField?: string;
  private orderDir: "asc" | "desc" = "asc";
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

  in(field: string, val: any[]) {
    if (!val || val.length === 0) {
      this.filters.push({ field, op: "==", val: "__NO_MATCH__" });
    } else {
      this.filters.push({ field, op: "in", val: val.slice(0, 30) });
    }
    return this;
  }

  limit(n: number) {
    this.limitNum = n;
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderDir = opts?.ascending === false ? "desc" : "asc";
    return this;
  }

  async then(resolve: (res: any) => void, _reject: (err: any) => void) {
    try {
      let q = query(collection(serverDb, this.colName));
      for (const f of this.filters) {
        q = query(q, where(f.field, f.op, f.val));
      }
      if (this.orderField) {
        q = query(q, orderBy(this.orderField, this.orderDir));
      }
      if (this.limitNum) {
        q = query(q, limit(this.limitNum));
      }
      const snap = await getDocs(q);
      const data = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      resolve({ data, error: null });
    } catch (_err) {
      resolve({ data: [], error: null });
    }
  }

  async single() {
    try {
      let q = query(collection(serverDb, this.colName));
      for (const f of this.filters) {
        q = query(q, where(f.field, f.op, f.val));
      }
      q = query(q, limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        return { data: null, error: { message: "Row not found", code: "PGRST116" } };
      }
      const docSnap = snap.docs[0];
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } catch (_err) {
      return { data: null, error: null };
    }
  }

  async maybeSingle() {
    try {
      let q = query(collection(serverDb, this.colName));
      for (const f of this.filters) {
        q = query(q, where(f.field, f.op, f.val));
      }
      q = query(q, limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        return { data: null, error: null };
      }
      const docSnap = snap.docs[0];
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } catch (_err) {
      return { data: null, error: null };
    }
  }

  insert(payload: any) {
    return new InsertBuilder(this.colName, payload);
  }

  update(payload: any) {
    return new UpdateBuilder(this.colName, payload, this.filters);
  }

  delete() {
    return new DeleteBuilder(this.colName, this.filters);
  }
}

export const supabaseServer: any = {
  from: (table: string) => new FirestoreQueryBuilder(table),
  auth: {
    admin: {
      createUser: async (opts: any) => {
        try {
          return { data: { user: { uid: crypto.randomUUID(), email: opts.email } }, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },
      listUsers: async () => {
        try {
          const snap = await getDocs(collection(serverDb, "users"));
          const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
          return { data: { users }, error: null };
        } catch (_err) {
          return { data: { users: [] }, error: null };
        }
      },
      getUserById: async (uid: string) => {
        try {
          const docSnap = await getDoc(doc(serverDb, "users", uid));
          if (!docSnap.exists()) return { data: null, error: "User not found" };
          return { data: { user: { uid, ...docSnap.data() } }, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },
      updateUserById: async (uid: string, opts: any) => {
        try {
          await updateDoc(doc(serverDb, "users", uid), opts);
          return { data: { user: { uid, ...opts } }, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },
      deleteUser: async (uid: string) => {
        try {
          await deleteDoc(doc(serverDb, "users", uid));
          return { data: true, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },
    },
    getUser: async (_token: string) => {
      try {
        const u = serverAuth.currentUser;
        return { data: { user: u }, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },
  },
};

export const supabaseAdmin = supabaseServer;

export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__session")?.value || cookieStore.get("fb_token")?.value;
    if (!token) return serverAuth.currentUser;
    return serverAuth.currentUser;
  } catch (_err) {
    return null;
  }
}
