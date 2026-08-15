"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
      // 1. Check if OAuth provider / Supabase returned an error in hash or query parameters
      const searchParams = new URLSearchParams(window.location.search);
      const hashString = window.location.hash.startsWith("#")
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hashString);

      const error =
        hashParams.get("error") ||
        searchParams.get("error") ||
        hashParams.get("oauth_error") ||
        searchParams.get("oauth_error");

      const errorCode =
        hashParams.get("error_code") ||
        searchParams.get("error_code") ||
        hashParams.get("oauth_error_code") ||
        searchParams.get("oauth_error_code");

      const errorDesc =
        hashParams.get("error_description") ||
        searchParams.get("error_description") ||
        hashParams.get("oauth_error_description") ||
        searchParams.get("oauth_error_description") ||
        hashParams.get("msg") ||
        searchParams.get("msg") ||
        hashParams.get("message") ||
        searchParams.get("message");

      if (error || errorDesc) {
        const fullErrorMsg = errorDesc
          ? decodeURIComponent(errorDesc.replace(/\+/g, " "))
          : error || "OAuth authentication failed";

        console.error("❌ [OAuth Callback] Received error from OAuth provider / Supabase:", {
          error,
          errorCode,
          errorDesc: fullErrorMsg,
          search: window.location.search,
          hash: window.location.hash,
          fullUrl: window.location.href,
        });

        const targetParams = new URLSearchParams();
        if (error) targetParams.set("oauth_error", error);
        if (errorCode) targetParams.set("oauth_error_code", errorCode);
        if (fullErrorMsg) targetParams.set("oauth_error_description", fullErrorMsg);

        router.replace(`/login?${targetParams.toString()}`);
        return;
      }

      // 2. Exchange code / retrieve authenticated session
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser();

      if (getUserError || !user) {
        console.error("❌ [OAuth Callback] Failed to retrieve authenticated user:", {
          error: getUserError,
          search: window.location.search,
          hash: window.location.hash,
          fullUrl: window.location.href,
        });

        const desc =
          getUserError?.message ||
          "Could not establish a valid session. Please verify that your Google OAuth credentials and redirect URIs match.";
        const targetParams = new URLSearchParams();
        targetParams.set("oauth_error", "session_not_found");
        targetParams.set("oauth_error_description", desc);

        router.replace(`/login?${targetParams.toString()}`);
        return;
      }

      console.log("✅ [OAuth Callback] Authenticated user session found:", user.email, `(${user.id})`);
      setUser(user);

      // 3. Primary lookup by uid
      let { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("uid", user.id)
        .maybeSingle();

      // 4. Fallback lookup by email if uid didn't match
      if (!userData && !fetchError && user.email) {
        const { data: emailMatchedUser, error: emailError } = await supabase
          .from("users")
          .select("*")
          .ilike("email", user.email)
          .maybeSingle();

        if (emailMatchedUser) {
          userData = emailMatchedUser;
          if (emailMatchedUser.uid !== user.id) {
            await supabase
              .from("users")
              .update({ uid: user.id, updatedAt: new Date().toISOString() })
              .eq("email", emailMatchedUser.email);
          }
        } else if (emailError) {
          fetchError = emailError;
        }
      }

      if (!userData) {
        if (fetchError) {
          // Transient fetch error — don't delete or bounce to no-account.
          console.error("❌ [OAuth Callback] Profile fetch error on OAuth callback:", fetchError);
          const targetParams = new URLSearchParams();
          targetParams.set("oauth_error", "profile_fetch_error");
          targetParams.set("oauth_error_description", "Could not load your profile. Please try signing in again.");
          router.replace(`/login?${targetParams.toString()}`);
          return;
        }
        // No whitelisted profile row for this authenticated user.
        console.warn("⚠️ [OAuth Callback] No whitelisted profile row for user:", user.email);
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
