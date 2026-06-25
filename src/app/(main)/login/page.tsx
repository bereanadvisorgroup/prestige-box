"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Fingerprint, Loader2, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { checkUserStatus } from "@/actions/auth-flow";
import { deleteUser } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase.client";
import { useAuthStore } from "@/stores/auth.store";

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <title>Google Icon</title>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 23 23">
    <title>Microsoft Icon</title>
    <path fill="#f25022" d="M0 0h11v11H0z" />
    <path fill="#7fba00" d="M12 0h11v11H12z" />
    <path fill="#00a4ef" d="M0 12h11v11H0z" />
    <path fill="#ffb900" d="M12 12h11v11H12z" />
  </svg>
);

const LoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setProfile, setLoading, isLoading } = useAuthStore();
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkError = (queryString: string) => {
        const params = new URLSearchParams(queryString);
        const error = params.get("error");
        const errorCode = params.get("error_code");
        const errorDescription = params.get("error_description");

        return (
          error === "server_error" ||
          errorCode === "unexpected_failure" ||
          errorDescription?.toLowerCase().includes("saving new user") ||
          errorDescription?.toLowerCase().includes("contact our office")
        );
      };

      const hasHashError = window.location.hash && checkError(window.location.hash.substring(1));
      const hasSearchError = window.location.search && checkError(window.location.search.substring(1));

      if (hasHashError || hasSearchError) {
        // Clear url parameters and hash to prevent redirection loop
        window.history.replaceState(null, "", window.location.pathname);
        router.push("/login/no-account");
      }
    }
  }, [router]);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleAuthRedirect = async (userId: string) => {
    // Fetch profile
    const { data: userData, error: fetchError } = await supabase.from("users").select("*").eq("uid", userId).single();

    if (fetchError || !userData) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userEmail = user?.email || "";
      deleteUser(userId).catch((err) => console.error("Failed to delete unauthorized user:", err));
      await supabase.auth.signOut();
      router.push(`/login/no-account?email=${encodeURIComponent(userEmail)}`);
      return;
    }

    // Set store profile
    setProfile({
      uid: userId,
      email: userData.email,
      role: userData.role,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || "",
      photoURL: userData.photoURL || "",
      createdAt: userData.createdAt,
    });

    // Check if they have a registered Passkey
    const { data: passkeys, error: passkeyListError } = await supabase.auth.passkey.list();
    const hasPasskey = !passkeyListError && passkeys && passkeys.length > 0;

    const defaultRoute =
      userData.role === "admin" || userData.role === "advisor" ? "/dashboard/crm" : "/dashboard/default";

    if (hasPasskey) {
      toast.success("Welcome back!");
      router.push(defaultRoute);
      return;
    }

    const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) {
      console.error("AAL check error:", aalError);
      router.push(defaultRoute);
      return;
    }

    if (aalData.nextLevel === "aal2" && aalData.currentLevel === "aal1") {
      toast.info("Multi-factor authentication required.");
      router.push("/auth/mfa-verify");
    } else if (aalData.nextLevel === "aal1") {
      toast.warning("MFA is mandatory. Redirecting to setup...");
      router.push("/auth/mfa-enroll");
    } else {
      toast.success("Welcome back!");
      router.push(defaultRoute);
    }
  };

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    try {
      setLoading(true);

      // 1. Perform Whitelist and Registration Check
      const statusRes = await checkUserStatus(values.email);
      if (!statusRes.success) {
        throw new Error(statusRes.error || "Failed to check account status.");
      }

      if (statusRes.status === "no_account") {
        router.push(`/login/no-account?email=${encodeURIComponent(values.email)}`);
        return;
      }

      if (statusRes.status === "create_account") {
        router.push(`/login/create-account?email=${encodeURIComponent(values.email)}`);
        return;
      }

      // 2. Perform Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;
      if (data.user) {
        setUser(data.user);
        await handleAuthRedirect(data.user.id);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    try {
      setIsPasskeyLoading(true);
      const { data, error } = await supabase.auth.signInWithPasskey();
      if (error) throw error;

      if (data?.user) {
        setUser(data.user);
        await handleAuthRedirect(data.user.id);
      }
    } catch (err: unknown) {
      console.error("Passkey sign in error:", err);
      const error = err as { message?: string };
      toast.error(error.message || "Passkey login failed or cancelled.");
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "azure") => {
    try {
      setIsOAuthLoading(provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard/default`,
          queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      toast.error((err as Error).message || `Could not authenticate with ${provider}.`);
      setIsOAuthLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[#eae8e4] p-4 text-[#1a1a1a]">
      <div className="relative w-full max-w-[430px] rounded-[28px] border border-neutral-300 bg-[#f4f2ee] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.08)]">
        {/* Company Logo Header Banner */}
        <div className="mb-4 flex items-center justify-center overflow-hidden rounded-2xl bg-[#020816] px-8 py-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://assets.agentfire3.com/uploads/sites/2548/2026/01/Prestige-Advisors-logo-white-210xAUTO.fit.png"
            alt="Prestige Advisors Logo"
            className="h-14 w-auto object-contain"
          />
        </div>

        {/* Secure Portal Title */}
        <div className="mb-5 text-center font-semibold text-neutral-500 text-xs">Secure Client & Advisor Portal</div>

        {/* 1. Passkey - Preferred login method */}
        <div className="mb-5">
          <Button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-[#eae7e2] py-6 font-bold text-neutral-800 text-xs shadow-sm transition-all duration-300 hover:bg-[#dfdbd5]"
            onClick={handlePasskeySignIn}
            disabled={isPasskeyLoading || isLoading}
          >
            {isPasskeyLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Fingerprint className="h-4 w-4 text-neutral-600" />
            )}
            Sign In with Passkey
          </Button>
        </div>

        {/* Divider 1 */}
        <hr className="-mx-6 mb-5 border-neutral-300 border-t" />

        {/* 2. Google & Microsoft OAuth */}
        <div className="mb-5 space-y-3">
          <Button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-[#eae7e2] py-6 font-bold text-neutral-800 text-xs shadow-sm transition-all duration-300 hover:bg-[#dfdbd5]"
            onClick={() => handleOAuthSignIn("google")}
            disabled={isOAuthLoading !== null || isLoading}
          >
            {isOAuthLoading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            LOGIN WITH GOOGLE →
          </Button>

          <Button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-[#eae7e2] py-6 font-bold text-neutral-800 text-xs shadow-sm transition-all duration-300 hover:bg-[#dfdbd5]"
            onClick={() => handleOAuthSignIn("azure")}
            disabled={isOAuthLoading !== null || isLoading}
          >
            {isOAuthLoading === "azure" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MicrosoftIcon />}
            LOGIN WITH MICROSOFT →
          </Button>
        </div>

        {/* Divider 2 */}
        <hr className="-mx-6 mb-3 border-neutral-300 border-t" />
        {/* 3. Email / Password form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="pl-0.5 font-bold text-neutral-700 text-xs tracking-wider">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute top-3.5 left-3 h-4 w-4 text-neutral-500" />
                      <Input
                        id="email"
                        placeholder="name@yourdomain.com"
                        className="rounded-xl border border-neutral-300 bg-[#eae7e2] py-5 pl-10 text-neutral-800 placeholder:text-neutral-500 focus-visible:ring-neutral-400"
                        autoComplete="email"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="pl-0.5 font-bold text-neutral-700 text-xs tracking-wider">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute top-3.5 left-3 h-4 w-4 text-neutral-500" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="...."
                        className="rounded-xl border border-neutral-300 bg-[#eae7e2] py-5 pl-10 text-neutral-800 placeholder:text-neutral-500 focus-visible:ring-neutral-400"
                        autoComplete="current-password"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="mt-2 w-full rounded-xl bg-[#0f5ca2] py-6 font-bold text-white text-xs shadow-md transition-all duration-300 hover:bg-[#0c4d87]"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "LOGIN WITH EMAIL →"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
