"use client";

import { Suspense, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Fingerprint, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { GoogleAuthProvider, OAuthProvider, signInWithPopup } from "firebase/auth";

import { registerUserWithPasskeyInit, registerUserWithPassword } from "@/actions/auth-flow";
import { PasswordRequirements } from "@/app/(main)/auth/_components/password-requirements";
import { GoogleButton } from "@/app/(main)/auth/_components/social-auth/google-button";
import { MicrosoftButton } from "@/app/(main)/auth/_components/social-auth/microsoft-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase.client";

const passwordValidation = z
  .string()
  .min(8, { message: "Password must be at least 8 characters." })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
  .regex(/[0-9]/, { message: "Password must contain at least one number." })
  .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." });

const FormSchema = z
  .object({
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

function CreateAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"passkey" | "password" | "social" | null>("passkey");

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!email) {
      toast.error("Invalid registration session.");
      router.replace("/login");
    }
  }, [email, router]);

  const handlePasswordRegister = async (values: z.infer<typeof FormSchema>) => {
    try {
      setIsLoading(true);

      // 1. Create auth user and update profile uid
      const registerRes = await registerUserWithPassword({ email, password: values.password });
      if (!registerRes.success) {
        throw new Error(registerRes.error || "Failed to register account.");
      }

      // 2. Log them in
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: values.password,
      });
      if (loginError) throw loginError;

      toast.success("Account created successfully!");
      // Since they did not select Passkey, redirect to MFA setup (or bypass during tests)
      if (process.env.NEXT_PUBLIC_BYPASS_MFA === "true") {
        router.replace("/dashboard");
      } else {
        router.replace("/auth/mfa-enroll");
      }
    } catch (error) {
      console.error("Password registration error:", error);
      toast.error((error as Error).message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyRegister = async () => {
    try {
      setIsLoading(true);

      // 1. Call Server Action to pre-create user in auth with random temp password
      const initRes = await registerUserWithPasskeyInit({ email });
      if (!initRes.success || !initRes.tempPassword) {
        throw new Error(initRes.error || "Failed to initialize Passkey setup.");
      }

      // 2. Sign in with the temp password to establish authenticated session
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: initRes.tempPassword,
      });
      if (loginError) throw loginError;

      // 3. Register the passkey
      toast.info("Opening WebAuthn prompt to register your device passkey...");
      const { error: passkeyError } = await supabase.auth.registerPasskey();
      if (passkeyError) {
        console.warn("Passkey registration failed or cancelled:", passkeyError);
        const errorMsg = passkeyError.message || "";
        if (errorMsg.includes("invalid for this domain") || errorMsg.includes("RP ID")) {
          toast.error("Passkey domain mismatch: Relying Party ID configured in Supabase does not match this domain.");
        } else {
          toast.warning("Passkey setup skipped or cancelled. Setting up Two-Factor Authentication instead.");
        }
        // If they skip or cancel passkey, force them to setup MFA (or bypass during tests)
        if (process.env.NEXT_PUBLIC_BYPASS_MFA === "true") {
          router.replace("/dashboard");
        } else {
          router.replace("/auth/mfa-enroll");
        }
        return;
      }

      toast.success("Passkey registered successfully! Welcome aboard.");
      router.replace("/dashboard");
    } catch (error) {
      console.error("Passkey registration error:", error);
      toast.error((error as Error).message || "Passkey setup failed.");
      setIsLoading(false);
    }
  };

  const handleOAuthRegister = async (provider: "google" | "azure") => {
    try {
      setIsLoading(true);
      let authProvider;
      if (provider === "google") {
        authProvider = new GoogleAuthProvider();
        authProvider.setCustomParameters({ prompt: "select_account" });
      } else {
        authProvider = new OAuthProvider("microsoft.com");
        authProvider.addScope("openid");
        authProvider.addScope("profile");
        authProvider.addScope("email");
      }
      await signInWithPopup(auth, authProvider);
      router.replace("/dashboard/default");
    } catch (error) {
      console.error("Social signup error:", error);
      toast.error((error as Error).message || `Failed to sign up with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-primary/10 via-transparent to-transparent opacity-50" />

      <div className="relative z-10 w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="font-extrabold text-3xl tracking-tight">Create New Account</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Set up your credentials for <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>

        <div className="grid gap-4">
          {/* PASSKEY REGISTER - PREFERRED METHOD */}
          <Card
            className={`cursor-pointer border-2 transition-all duration-300 ${
              selectedMethod === "passkey"
                ? "border-primary/80 bg-primary/5 shadow-md shadow-primary/10"
                : "border-border hover:border-primary/30 hover:bg-muted/10"
            }`}
            onClick={() => setSelectedMethod("passkey")}
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-5">
              <div
                className={`rounded-full p-2.5 ${selectedMethod === "passkey" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                <Fingerprint className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="font-bold text-base">Register with Device Passkey</CardTitle>
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 font-bold text-[10px] text-primary uppercase tracking-wider animate-pulse">
                    Recommended
                  </span>
                </div>
                <CardDescription className="text-xs">
                  Use Touch ID, Face ID, Windows Hello, or a security key. Safe, passwordless, and fast.
                </CardDescription>
              </div>
            </CardHeader>
            {selectedMethod === "passkey" && (
              <CardContent className="px-5 pb-5 pt-0">
                <Button
                  onClick={handlePasskeyRegister}
                  className="w-full font-bold shadow-md shadow-primary/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up device...
                    </>
                  ) : (
                    <>
                      Register Passkey & Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            )}
          </Card>

          {/* SOCIAL & PASSWORD ACCORDIONS */}
          <Card
            className={`cursor-pointer border transition-all duration-300 ${
              selectedMethod === "password" ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/20"
            }`}
            onClick={() => setSelectedMethod("password")}
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-5">
              <div
                className={`rounded-full p-2.5 ${selectedMethod === "password" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
              >
                <Lock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="font-bold text-sm">Register with Password</CardTitle>
                <CardDescription className="text-xs">
                  Create a secure password. Requires configuring an Authenticator app (2FA) afterwards.
                </CardDescription>
              </div>
            </CardHeader>
            {selectedMethod === "password" && (
              <CardContent className="px-5 pb-5 pt-0" onClick={(e) => e.stopPropagation()}>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handlePasswordRegister)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Choose Password</FormLabel>
                          <FormControl>
                            <Input
                              id="password"
                              type="password"
                              placeholder="••••••••"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <PasswordRequirements password={form.watch("password")} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="••••••••"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account & Setup 2FA"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            )}
          </Card>

          <Card
            className={`cursor-pointer border transition-all duration-300 ${
              selectedMethod === "social" ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/20"
            }`}
            onClick={() => setSelectedMethod("social")}
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-5">
              <div
                className={`rounded-full p-2.5 ${selectedMethod === "social" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
              >
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="font-bold text-sm">Register with Google or Microsoft</CardTitle>
                <CardDescription className="text-xs">
                  Link your institutional Google or Microsoft accounts.
                </CardDescription>
              </div>
            </CardHeader>
            {selectedMethod === "social" && (
              <CardContent className="grid gap-2 px-5 pb-5 pt-0" onClick={(e) => e.stopPropagation()}>
                <GoogleButton type="button" onClick={() => handleOAuthRegister("google")} disabled={isLoading} />
                <MicrosoftButton type="button" onClick={() => handleOAuthRegister("azure")} disabled={isLoading} />
              </CardContent>
            )}
          </Card>
        </div>

        <div className="mt-6 text-center text-muted-foreground text-xs">
          Protected by end-to-end multi-factor authentication.
        </div>
      </div>
    </div>
  );
}

export default function CreateAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CreateAccountContent />
    </Suspense>
  );
}
