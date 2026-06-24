"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Fingerprint, Loader2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { checkUserStatus } from "@/actions/auth-flow";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase.client";
import { useAuthStore } from "@/stores/auth.store";

const LoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setProfile, setLoading, isLoading } = useAuthStore();
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);

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
      await supabase.auth.signOut();
      toast.error("Access Denied. Your account has not been provisioned by an administrator.");
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
        router.push("/login/no-account");
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
        <div className="mb-6 text-center font-semibold text-neutral-500 text-xs uppercase tracking-wider">
          Secure Client & Advisor Portal
        </div>

        {/* 1. Passkey - Preferred login method */}
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

        {/* 2. Google OAuth */}
        <Button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-[#eae7e2] py-6 font-bold text-neutral-800 text-xs shadow-sm transition-all duration-300 hover:bg-[#dfdbd5]"
          onClick={() => handleOAuthSignIn("google")}
          disabled={isOAuthLoading !== null || isLoading}
        >
          {isOAuthLoading === "google" && <Loader2 className="h-4 w-4 animate-spin" />}
          LOGIN WITH GOOGLE →
        </Button>

        {/* 3. Microsoft OAuth */}
        <Button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-[#eae7e2] py-6 font-bold text-neutral-800 text-xs shadow-sm transition-all duration-300 hover:bg-[#dfdbd5]"
          onClick={() => handleOAuthSignIn("azure")}
          disabled={isOAuthLoading !== null || isLoading}
        >
          {isOAuthLoading === "azure" && <Loader2 className="h-4 w-4 animate-spin" />}
          LOGIN WITH MICROSOFT →
        </Button>

        {/* Divider */}
        <div className="relative my-6 flex items-center">
          <div className="flex-grow border-neutral-300 border-t" />
          <span className="mx-3 font-bold text-[10px] text-neutral-500 uppercase tracking-widest">Or passwordless</span>
          <div className="flex-grow border-neutral-300 border-t" />
        </div>

        {/* 4. Email / Password form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="pl-0.5 font-bold text-neutral-700 text-xs uppercase tracking-wider">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute top-3.5 left-3 h-4 w-4 text-neutral-500" />
                      <Input
                        id="email"
                        placeholder="name@company.com"
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
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      placeholder="PASSWORD"
                      className="rounded-xl border border-neutral-300 bg-[#eae7e2] py-5 text-center font-bold text-neutral-800 tracking-wider placeholder:text-neutral-600 focus-visible:ring-neutral-400"
                      autoComplete="current-password"
                      {...field}
                    />
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
