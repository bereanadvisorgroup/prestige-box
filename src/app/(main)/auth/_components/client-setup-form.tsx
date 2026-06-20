"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useLogger } from "next-axiom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase.client";
import { useAuthStore } from "@/stores/auth.store";

import { GoogleButton } from "./social-auth/google-button";
import { MicrosoftButton } from "./social-auth/microsoft-button";

import { PasswordRequirements } from "./password-requirements";

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

export function ClientSetupForm() {
  const [isLoading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const { profile } = useAuthStore();
  const log = useLogger();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    async function checkSession() {
      // Supabase handles processing recovery links from URL hash/query parameters automatically.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setHasSession(!!session);
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
      setCheckingSession(false);
    }
    checkSession();
  }, []);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (error) throw error;

      toast.success("Password has been set successfully!");
      log.info("Client successfully set password", { email: userEmail });

      const defaultRoute =
        profile?.role === "admin" || profile?.role === "advisor" ? "/dashboard/crm" : "/dashboard/default";
      router.push(defaultRoute);
    } catch (error) {
      console.error("Setup Password Error:", error);
      toast.error((error as { message: string }).message || "Failed to set password.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLink = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard/default`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google Link Error:", error);
      toast.error((error as { message: string }).message || "Could not link with Google.");
      setLoading(false);
    }
  };

  const onMicrosoftLink = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.linkIdentity({
        provider: "azure",
        options: {
          scopes: "email",
          redirectTo: `${window.location.origin}/dashboard/default`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Microsoft Link Error:", error);
      toast.error((error as { message: string }).message || "Could not link with Microsoft.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Verifying setup session...</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid or Expired Link</AlertTitle>
          <AlertDescription>
            For security reasons, setup links can only be used once and expire after a short time. Please contact your
            advisor for a new link.
          </AlertDescription>
        </Alert>
        <Button asChild className="w-full">
          <Link href="/auth/v1/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-2 sm:grid-cols-1">
        <GoogleButton type="button" onClick={onGoogleLink} disabled={isLoading} />
        <MicrosoftButton type="button" onClick={onMicrosoftLink} disabled={isLoading} />
      </div>

      <div className="relative my-6 text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
        <span className="relative z-10 bg-background px-2 text-muted-foreground">Or create a password</span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormItem>
            <FormLabel>Email Address</FormLabel>
            <FormControl>
              <Input type="email" value={userEmail} disabled className="bg-muted/50" />
            </FormControl>
          </FormItem>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input id="password" type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
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
                <FormLabel>Confirm New Password</FormLabel>
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
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Password & Continue"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
