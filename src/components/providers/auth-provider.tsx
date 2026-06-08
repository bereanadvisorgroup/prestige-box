"use client";

import { type ReactNode, useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase.client";
import { useAuthStore } from "@/stores/auth.store";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, setUser, setProfile, setLoading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 1. Get initial session/user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        supabase
          .from("users")
          .select("*")
          .eq("uid", user.id)
          .single()
          .then(({ data: userData, error }) => {
            if (userData && !error) {
              setProfile({
                uid: user.id,
                email: user.email ?? null,
                role: userData.role,
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone || "",
                photoURL: userData.photoURL || user.user_metadata?.avatar_url || "",
                createdAt: userData.createdAt,
              });
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setUser(user);

      if (user) {
        try {
          const { data: userData, error } = await supabase.from("users").select("*").eq("uid", user.id).single();

          if (userData && !error) {
            setProfile({
              uid: user.id,
              email: user.email ?? null,
              role: userData.role,
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone || "",
              photoURL: userData.photoURL || user.user_metadata?.avatar_url || "",
              createdAt: userData.createdAt,
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

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setLoading]);

  // Client-side route guarding
  useEffect(() => {
    if (isLoading) return;

    const isDashboardRoute = pathname.startsWith("/dashboard");
    const isAuthRoute = pathname.startsWith("/auth");

    if (isDashboardRoute && !user) {
      router.replace("/auth/v1/login");
    } else if (isAuthRoute && user) {
      router.replace("/dashboard/default");
    }
  }, [user, isLoading, pathname, router]);

  return <>{children}</>;
}
