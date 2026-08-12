import "server-only";

import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import {
  type Firestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit as fsLimit,
  orderBy as fsOrderBy,
  query as fsQuery,
  setDoc,
  where as fsWhere,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAo4k-la6Aizg6cLJNM1YDZOVWmlhUSGcY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "prestige-box-505310.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "prestige-box-505310",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "prestige-box-505310.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "906901210872",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:906901210872:web:7b837c9156c98d76b89d0d",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-DBYJ101NYW",
};

function initApp() {
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
}

export const serverApp: FirebaseApp = initApp();
export const serverAuth: Auth = getAuth(serverApp);
export const serverDb: Firestore = getFirestore(serverApp);

class CollectionQueryAdapter {
  private colName: string;
  private filters: Array<{ field: string; op: any; val: any }> = [];
  private orderField?: string;
  private orderDir: "asc" | "desc" = "asc";
  private limitNum?: number;

  constructor(colName: string) {
    this.colName = colName;
  }

  where(field: string, op: any, val: any) {
    this.filters.push({ field, op, val });
    return this;
  }

  orderBy(field: string, dir: "asc" | "desc" = "asc") {
    this.orderField = field;
    this.orderDir = dir;
    return this;
  }

  limit(n: number) {
    this.limitNum = n;
    return this;
  }

  doc(id: string) {
    const colName = this.colName;
    return {
      get: async () => {
        const d = await getDoc(doc(serverDb, colName, id));
        return {
          exists: d.exists(),
          data: () => d.data(),
        };
      },
      set: async (data: any, options?: any) => {
        await setDoc(doc(serverDb, colName, id), data, options);
      },
      delete: async () => {
        await deleteDoc(doc(serverDb, colName, id));
      },
    };
  }

  async get() {
    let q = fsQuery(collection(serverDb, this.colName));
    for (const f of this.filters) {
      q = fsQuery(q, fsWhere(f.field, f.op, f.val));
    }
    if (this.orderField) {
      q = fsQuery(q, fsOrderBy(this.orderField, this.orderDir));
    }
    if (this.limitNum) {
      q = fsQuery(q, fsLimit(this.limitNum));
    }
    const snap = await getDocs(q);
    return {
      empty: snap.empty,
      docs: snap.docs.map((d) => ({
        id: d.id,
        data: () => d.data(),
      })),
    };
  }
}

// Compatibility exports
export const adminApp = serverApp;
export const adminAuth = serverAuth;
export const adminDb: any = new Proxy(serverDb, {
  get(target, prop, receiver) {
    if (prop === "collection") {
      return (colName: string) => new CollectionQueryAdapter(colName);
    }
    return Reflect.get(target, prop, receiver);
  },
});
