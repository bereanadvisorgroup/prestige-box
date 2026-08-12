"use client";

import { type ReactNode, useEffect } from "react";

import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase.client";
import { useAuthStore, type UserProfile } from "@/stores/auth.store";

async function fetchUserProfile(userId: string, email?: string | null) {
  try {
    // 1. Check document by userId
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      return { profileData: userSnap.data() as UserProfile, error: null };
    }

    // 2. Check by email if available
    if (email) {
      const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const d = querySnap.docs[0];
        return { profileData: d.data() as UserProfile, error: null };
      }
    }

    // 3. Auto-provision profile for authenticated Google/Microsoft user if doc doesn't exist
    if (email) {
      const isMatt = email.toLowerCase() === "matt@prestigeprivateclient.com";
      const isAdminEmail = isMatt || email.toLowerCase().includes("admin");
      const displayName = auth.currentUser?.displayName || email.split("@")[0] || "User";
      const [firstName, ...rest] = displayName.split(" ");
      const lastName = rest.join(" ") || (isMatt ? "Duvall" : "");

      const newProfile: UserProfile = {
        uid: userId,
        email,
        role: isAdminEmail ? "admin" : "advisor",
        firstName: firstName || "User",
        lastName,
        photoURL: auth.currentUser?.photoURL || "",
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, "users", userId), newProfile, { merge: true });
      } catch (e) {
        console.warn("Could not save new profile to Firestore:", e);
      }

      return { profileData: newProfile, error: null };
    }

    return { profileData: null, error: null };
  } catch (err) {
    console.error("Error fetching user profile from Firestore:", err);

    // Fallback profile if Firestore read fails
    if (email) {
      const isMatt = email.toLowerCase() === "matt@prestigeprivateclient.com";
      const displayName = auth.currentUser?.displayName || email.split("@")[0] || "User";
      const [firstName, ...rest] = displayName.split(" ");

      const fallbackProfile: UserProfile = {
        uid: userId,
        email,
        role: isMatt || email.toLowerCase().includes("admin") ? "admin" : "advisor",
        firstName: firstName || "User",
        lastName: rest.join(" ") || (isMatt ? "Duvall" : ""),
        photoURL: auth.currentUser?.photoURL || "",
        createdAt: new Date().toISOString(),
      };
      return { profileData: fallbackProfile, error: null };
    }

    return { profileData: null, error: err };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, profile, isLoading, setUser, setProfile, setLoading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const { profileData } = await fetchUserProfile(firebaseUser.uid, firebaseUser.email);

          if (profileData) {
            const googlePhotoURL = firebaseUser.photoURL || null;

            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email ?? profileData.email ?? null,
              role: profileData.role || "admin",
              firstName: profileData.firstName || firebaseUser.displayName?.split(" ")[0] || "User",
              lastName: profileData.lastName || firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
              phone: profileData.phone || "",
              photoURL: profileData.photoURL || googlePhotoURL || "",
              socialMedia: profileData.socialMedia || [],
              googlePhotoURL,
              providers: firebaseUser.providerData.map((p) => p.providerId),
              createdAt: profileData.createdAt,
            });
          }
        } catch (error) {
          console.error("Error fetching user profile in AuthProvider:", error);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setProfile, setLoading]);

  // Client-side route guarding
  useEffect(() => {
    if (isLoading) return;

    const isDashboardRoute = pathname.startsWith("/dashboard");
    const isAuthRoute =
      pathname.startsWith("/auth") &&
      !pathname.includes("/reset-password") &&
      !pathname.includes("/client-setup") &&
      !pathname.includes("/callback");

    if (isDashboardRoute && !user) {
      router.replace("/login");
    } else if (isAuthRoute && user) {
      const defaultRoute =
        profile?.role === "admin" || profile?.role === "advisor" ? "/dashboard/crm" : "/dashboard/default";
      router.replace(defaultRoute);
    } else if (user && profile) {
      const role = profile.role;
      const isAdminOrAdvisor = role === "admin" || role === "advisor";

      if (isAdminOrAdvisor) {
        if (pathname === "/dashboard" || pathname === "/dashboard/default") {
          router.replace("/dashboard/crm");
        }
      } else if (role === "client") {
        if (
          pathname === "/dashboard" ||
          pathname.startsWith("/dashboard/crm") ||
          pathname.startsWith("/dashboard/admin") ||
          pathname.startsWith("/dashboard/reports") ||
          pathname.startsWith("/dashboard/finance")
        ) {
          router.replace("/dashboard/default");
        }
      }
    }
  }, [user, profile, isLoading, pathname, router]);

  return <>{children}</>;
}
