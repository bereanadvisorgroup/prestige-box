"use client";

import { type ReactNode, useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

import { toast } from "sonner";

import { supabase } from "@/lib/supabase.client";
import { useAuthStore } from "@/stores/auth.store";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, profile, isLoading, setUser, setProfile, setLoading } = useAuthStore();
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
            } else {
              supabase.auth.signOut().then(() => {
                setUser(null);
                setProfile(null);
                toast.error("Access Denied. Please contact an administrator.");
                router.replace("/login");
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
          } else {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            toast.error("Access Denied. Please contact an administrator.");
            router.replace("/login");
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
  }, [setUser, setProfile, setLoading, router]);

  // Client-side route guarding
  useEffect(() => {
    if (isLoading) return;

    const isDashboardRoute = pathname.startsWith("/dashboard");
    const isAuthRoute =
      pathname.startsWith("/auth") && !pathname.includes("/reset-password") && !pathname.includes("/client-setup");

    if (isDashboardRoute && !user) {
      router.replace("/login");
    } else if (isDashboardRoute && user) {
      // Verify AAL level client-side
      supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data, error }) => {
        if (!error && data && data.currentLevel === "aal1" && data.nextLevel === "aal2") {
          router.replace("/auth/mfa-verify");
        }
      });
    } else if (isAuthRoute && user) {
      supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data, error }) => {
        if (!error && data && data.currentLevel === "aal1" && data.nextLevel === "aal2") {
          router.replace("/auth/mfa-verify");
        } else {
          const defaultRoute =
            profile?.role === "admin" || profile?.role === "advisor" ? "/dashboard/crm" : "/dashboard/default";
          router.replace(defaultRoute);
        }
      });
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
          pathname.startsWith("/dashboard/finance") ||
          pathname.startsWith("/dashboard/crm-pipeline")
        ) {
          router.replace("/dashboard/default");
        }
      }
    }
  }, [user, profile, isLoading, pathname, router]);

  return <>{children}</>;
}
