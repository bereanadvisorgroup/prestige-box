"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Fingerprint, Loader2, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { checkUserStatus } from "@/actions/auth-flow";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase.client";
import { useAuthStore } from "@/stores/auth.store";

const EmailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

const LoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setProfile, setLoading, isLoading } = useAuthStore();
  const [step, setStep] = useState<"email" | "credentials">("email");
  const [emailVal, setEmailVal] = useState("");
  const [isStatusChecking, setIsStatusChecking] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  const emailForm = useForm<z.infer<typeof EmailSchema>>({
    resolver: zodResolver(EmailSchema),
    defaultValues: {
      email: "",
    },
  });

  const credentialsForm = useForm<z.infer<typeof LoginSchema>>({
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

  const onEmailSubmit = async (values: z.infer<typeof EmailSchema>) => {
    try {
      setIsStatusChecking(true);
      const res = await checkUserStatus(values.email);

      if (!res.success) {
        throw new Error(res.error || "Failed to check account status.");
      }

      const email = res.email || values.email;
      setEmailVal(email);

      if (res.status === "no_account") {
        router.push("/login/no-account");
      } else if (res.status === "create_account") {
        router.push(`/login/create-account?email=${encodeURIComponent(email)}`);
      } else {
        // "login" - show credentials form
        credentialsForm.setValue("email", email);
        setStep("credentials");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "An unexpected error occurred.");
    } finally {
      setIsStatusChecking(false);
    }
  };

  const onCredentialsSubmit = async (values: z.infer<typeof LoginSchema>) => {
    try {
      setLoading(true);
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

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-primary/10 via-transparent to-transparent opacity-50" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/60 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
            <Fingerprint className="h-10 w-10 animate-pulse" />
          </div>
          <h1 className="font-extrabold text-3xl tracking-tight">Prestige Advisors</h1>
          <p className="mt-2 text-muted-foreground text-sm">Secure Client & Advisor Portal</p>
        </div>

        {step === "email" ? (
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          placeholder="name@company.com"
                          className="pl-10"
                          autoComplete="email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="mt-2 w-full font-semibold" disabled={isStatusChecking}>
                {isStatusChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking account...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...credentialsForm}>
            <form onSubmit={credentialsForm.handleSubmit(onCredentialsSubmit)} className="space-y-4">
              <div className="rounded-lg border border-border/30 bg-muted/30 p-3 text-muted-foreground text-sm">
                Email: <span className="font-semibold text-foreground">{emailVal}</span>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="ml-2 text-primary text-xs underline hover:text-primary/80"
                >
                  Change
                </button>
              </div>

              <FormField
                control={credentialsForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          autoComplete="current-password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="mt-2 w-full font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Sign In with Password"
                )}
              </Button>
            </form>
          </Form>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-border border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or passwordless</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full border-primary/20 font-semibold transition-all duration-300 hover:bg-primary/5 hover:text-primary"
          onClick={handlePasskeySignIn}
          disabled={isPasskeyLoading || isLoading || isStatusChecking}
        >
          {isPasskeyLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting Key...
            </>
          ) : (
            <>
              <Fingerprint className="mr-2 h-4 w-4" />
              Sign In with Passkey
            </>
          )}
        </Button>

        <div className="mt-6 text-center text-muted-foreground text-xs">
          Protected by end-to-end multi-factor authentication.
        </div>
      </div>
    </div>
  );
}
