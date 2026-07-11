"use client";

import { type ReactNode, useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

import { deleteUser } from "@/actions/users";
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
          .maybeSingle()
          .then(({ data: userData, error }) => {
            if (userData) {
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
            } else if (!error) {
              // Confirmed: this authenticated user has no whitelisted profile row.
              deleteUser(user.id).catch((err) => console.error("Failed to delete unauthorized user:", err));
              supabase.auth.signOut().then(() => {
                setUser(null);
                setProfile(null);
                router.replace(`/login/no-account?email=${encodeURIComponent(user.email ?? "")}`);
              });
            } else {
              // Transient fetch error (e.g. the JWT rotating during an MFA upgrade).
              // Do NOT sign out or delete — that would bounce a valid session to /login.
              console.error("Profile fetch error (non-fatal), keeping session:", error);
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
          const { data: userData, error } = await supabase.from("users").select("*").eq("uid", user.id).maybeSingle();

          if (userData) {
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
          } else if (!error) {
            // Confirmed: this authenticated user has no whitelisted profile row.
            deleteUser(user.id).catch((err) => console.error("Failed to delete unauthorized user:", err));
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            router.replace(`/login/no-account?email=${encodeURIComponent(user.email ?? "")}`);
          } else {
            // Transient fetch error (e.g. the JWT rotating during an MFA upgrade).
            // Do NOT sign out or delete — that would bounce a valid session to /login.
            console.error("Profile fetch error (non-fatal), keeping session:", error);
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
      pathname.startsWith("/auth") &&
      !pathname.includes("/reset-password") &&
      !pathname.includes("/client-setup") &&
      // The MFA enroll/verify pages manage their own redirects. Excluding them here
      // prevents the guard's else-branch from bouncing a user who is mid-enrollment
      // (nextLevel is still "aal1" until a factor is verified) back to the dashboard.
      !pathname.includes("/mfa-") &&
      // The OAuth callback resolves the role-based destination itself; excluding it
      // avoids racing with this guard during the post-OAuth redirect.
      !pathname.includes("/callback");

    if (isDashboardRoute && !user) {
      router.replace("/login");
    } else if (isDashboardRoute && user) {
      // Verify AAL level client-side, bypassing if user has a registered Passkey or MFA bypass is active
      Promise.all([supabase.auth.mfa.getAuthenticatorAssuranceLevel(), supabase.auth.passkey.list()]).then(
        ([{ data: aalData, error: aalError }, { data: passkeys, error: passkeyError }]) => {
          const hasPasskey = !passkeyError && passkeys && passkeys.length > 0;
          if (hasPasskey || process.env.NEXT_PUBLIC_BYPASS_MFA === "true") return; // Passkey or bypass satisfies secure login factor

          if (aalError || !aalData) return;

          if (aalData.currentLevel === "aal1" && aalData.nextLevel === "aal2") {
            // Has a verified factor but hasn't satisfied it this session: verify.
            router.replace("/auth/mfa-verify");
          } else if (aalData.nextLevel === "aal1") {
            // No passkey and no verified factor (e.g. OAuth sign-in): force MFA enrollment.
            router.replace("/auth/mfa-enroll");
          }
        },
      );
    } else if (isAuthRoute && user) {
      Promise.all([supabase.auth.mfa.getAuthenticatorAssuranceLevel(), supabase.auth.passkey.list()]).then(
        ([{ data: aalData, error: aalError }, { data: passkeys, error: passkeyError }]) => {
          const hasPasskey = !passkeyError && passkeys && passkeys.length > 0;
          const defaultRoute =
            profile?.role === "admin" || profile?.role === "advisor" ? "/dashboard/crm" : "/dashboard/default";

          if (hasPasskey || process.env.NEXT_PUBLIC_BYPASS_MFA === "true") {
            router.replace(defaultRoute);
            return;
          }

          if (!aalError && aalData && aalData.currentLevel === "aal1" && aalData.nextLevel === "aal2") {
            router.replace("/auth/mfa-verify");
          } else {
            router.replace(defaultRoute);
          }
        },
      );
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
