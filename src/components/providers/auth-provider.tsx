"use client";

import { type ReactNode, useEffect } from "react";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase.client";
import { useAuthStore } from "@/stores/auth.store";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        try {
          // Re-fetch profile from Firestore to ensure it's up to date (including photoURL)
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setProfile({
              uid: user.uid,
              email: user.email,
              role: userData.role,
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone || "",
              photoURL: userData.photoURL || user.photoURL || "",
              createdAt: userData.createdAt,
            });
          }
        } catch (error) {
          console.error("Error fetching user profile in AuthProvider:", error);
        }
      } else {
        // Optional: clear profile if no user?
        // For now, let's keep it if we want persistent experience, but Firebase says no user.
        // setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setProfile, setLoading]);

  return <>{children}</>;
}
