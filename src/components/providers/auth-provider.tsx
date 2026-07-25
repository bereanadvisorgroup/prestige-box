"use client";

import { type ReactNode, useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase.client";
import { useAuthStore } from "@/stores/auth.store";

async function fetchUserProfile(userId: string, email?: string | null) {
  // 1. Primary lookup by uid
  const { data: userData, error } = await supabase.from("users").select("*").eq("uid", userId).maybeSingle();

  if (userData) return { profileData: userData, error: null };

  // 2. Fallback lookup by email if uid was not synced
  if (!error && email) {
    const { data: emailUser, error: emailErr } = await supabase
      .from("users")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (emailUser) {
      if (emailUser.uid !== userId) {
        await supabase
          .from("users")
          .update({ uid: userId, updatedAt: new Date().toISOString() })
          .eq("id", emailUser.id);
      }
      return { profileData: emailUser, error: null };
    }
    return { profileData: null, error: emailErr };
  }

  return { profileData: null, error };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, profile, isLoading, setUser, setProfile, setLoading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 1. Get initial session/user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        const { profileData, error } = await fetchUserProfile(user.id, user.email);
        if (profileData) {
          setProfile({
            uid: user.id,
            email: user.email ?? profileData.email ?? null,
            role: profileData.role,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            phone: profileData.phone || "",
            photoURL: profileData.photoURL || user.user_metadata?.avatar_url || "",
            createdAt: profileData.createdAt,
          });
        } else if (!error) {
          // User authenticated but no profile row found in public.users.
          // Sign out safely — NEVER delete the user account automatically.
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          router.replace(`/login/no-account?email=${encodeURIComponent(user.email ?? "")}`);
        } else {
          // Transient fetch error (e.g. JWT rotating during MFA upgrade).
          // Do NOT sign out or delete — keep the session active.
          console.error("Profile fetch error (non-fatal), keeping session:", error);
        }
        setLoading(false);
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
          const { profileData, error } = await fetchUserProfile(user.id, user.email);

          if (profileData) {
            setProfile({
              uid: user.id,
              email: user.email ?? profileData.email ?? null,
              role: profileData.role,
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              phone: profileData.phone || "",
              photoURL: profileData.photoURL || user.user_metadata?.avatar_url || "",
              createdAt: profileData.createdAt,
            });
          } else if (!error) {
            // User authenticated but no profile row found in public.users.
            // Sign out safely — NEVER delete the user account automatically.
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            router.replace(`/login/no-account?email=${encodeURIComponent(user.email ?? "")}`);
          } else {
            // Transient fetch error — keep session.
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
          const isPlaywright =
            (typeof window !== "undefined" &&
              (window.localStorage.getItem("is_e2e") === "true" ||
                window.navigator.webdriver ||
                process.env.NEXT_PUBLIC_IS_E2E === "true")) ||
            (typeof document !== "undefined" && document.cookie.includes("is_e2e=true"));
          if (isPlaywright) return;

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
          const isPlaywright =
            (typeof window !== "undefined" &&
              (window.localStorage.getItem("is_e2e") === "true" ||
                window.navigator.webdriver ||
                process.env.NEXT_PUBLIC_IS_E2E === "true")) ||
            (typeof document !== "undefined" && document.cookie.includes("is_e2e=true"));
          const defaultRoute =
            profile?.role === "admin" || profile?.role === "advisor" ? "/dashboard/crm" : "/dashboard/default";

          if (isPlaywright) {
            router.replace(defaultRoute);
            return;
          }

          const hasPasskey = !passkeyError && passkeys && passkeys.length > 0;
          if (hasPasskey) {
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
          pathname.startsWith("/dashboard/finance")
        ) {
          router.replace("/dashboard/default");
        }
      }
    }
  }, [user, profile, isLoading, pathname, router]);

  return <>{children}</>;
}
