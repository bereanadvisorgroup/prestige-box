"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { deleteUser } from "@/actions/users";
import { supabase } from "@/lib/supabase.client";
import { useAuthStore } from "@/stores/auth.store";

/**
 * OAuth (Google / Microsoft) return target. The user's role is unknown until the
 * provider redirects back, so we resolve the role-based destination here instead
 * of landing on /dashboard/default and letting the route guard bounce admins
 * (which causes a flash of the wrong dashboard). This mirrors `handleAuthRedirect`
 * in the login page. It is excluded from the AuthProvider guard so it owns its
 * own routing.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser, setProfile } = useAuthStore();

  useEffect(() => {
    const resolve = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUser(user);

      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("uid", user.id)
        .maybeSingle();

      if (!userData) {
        if (fetchError) {
          // Transient fetch error — don't delete/sign out a potentially valid user.
          console.error("Profile fetch error on OAuth callback:", fetchError);
          toast.error("Could not load your profile. Please try signing in again.");
          router.replace("/login");
          return;
        }
        // Confirmed: no whitelisted profile row for this authenticated user.
        deleteUser(user.id).catch((err) => console.error("Failed to delete unauthorized user:", err));
        await supabase.auth.signOut();
        router.replace(`/login/no-account?email=${encodeURIComponent(user.email ?? "")}`);
        return;
      }

      setProfile({
        uid: user.id,
        email: userData.email,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || "",
        photoURL: userData.photoURL || user.user_metadata?.avatar_url || "",
        createdAt: userData.createdAt,
      });

      const defaultRoute =
        userData.role === "admin" || userData.role === "advisor" ? "/dashboard/crm" : "/dashboard/default";

      // A registered passkey already satisfies the secure login factor.
      const { data: passkeys, error: passkeyListError } = await supabase.auth.passkey.list();
      const hasPasskey = !passkeyListError && passkeys && passkeys.length > 0;
      if (hasPasskey || process.env.NEXT_PUBLIC_BYPASS_MFA === "true") {
        toast.success("Welcome back!");
        router.replace(defaultRoute);
        return;
      }

      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError || !aalData) {
        router.replace(defaultRoute);
        return;
      }

      if (aalData.nextLevel === "aal2" && aalData.currentLevel === "aal1") {
        toast.info("Multi-factor authentication required.");
        router.replace("/auth/mfa-verify");
      } else if (aalData.nextLevel === "aal1") {
        toast.warning("MFA is mandatory. Redirecting to setup...");
        router.replace("/auth/mfa-enroll");
      } else {
        toast.success("Welcome back!");
        router.replace(defaultRoute);
      }
    };

    resolve();
  }, [router, setUser, setProfile]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
