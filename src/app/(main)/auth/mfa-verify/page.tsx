"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/lib/supabase.client";
import { useAuthStore } from "@/stores/auth.store";

export default function MFAVerifyPage() {
  const router = useRouter();
  const { user, profile, isLoading: isAuthLoading } = useAuthStore();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      toast.error("Please sign in first.");
      router.replace("/login");
      return;
    }

    // List factors to verify if the user has an active factor to verify
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (error) {
        toast.error("Failed to load authentication factors.");
        setIsPageLoading(false);
        return;
      }

      const activeFactor = data?.totp?.find((f) => f.status === "verified");
      if (!activeFactor) {
        toast.warning("MFA is required but no active factors were found. Redirecting to setup...");
        router.replace("/auth/mfa-enroll");
        return;
      }

      setFactorId(activeFactor.id);
      setIsPageLoading(false);
    });
  }, [user, isAuthLoading, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || code.length !== 6) return;

    try {
      setIsVerifying(true);
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });

      if (error) throw error;

      toast.success("Verification successful!");
      const defaultRoute =
        profile?.role === "admin" || profile?.role === "advisor" ? "/dashboard/crm" : "/dashboard/default";
      router.push(defaultRoute);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Invalid verification code.");
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isAuthLoading || isPageLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-primary/10 via-transparent to-transparent opacity-50" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/60 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-10 w-10 animate-bounce" />
          </div>
          <h1 className="font-bold text-2xl tracking-tight">Two-Step Verification</h1>
          <p className="mt-2 text-muted-foreground text-sm">Enter the 6-digit code from your authenticator app.</p>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col items-center space-y-6">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(val) => setCode(val)}
            disabled={isVerifying}
            containerClassName="justify-center"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button type="submit" className="w-full font-semibold" disabled={isVerifying || code.length !== 6}>
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying Code...
              </>
            ) : (
              "Verify Code"
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground text-xs hover:text-foreground"
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
          >
            Back to Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
