"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Check, Copy, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/lib/supabase.client";
import { useAuthStore } from "@/stores/auth.store";

export default function MFAEnrollPage() {
  const router = useRouter();
  const { user, profile, isLoading: isAuthLoading } = useAuthStore();

  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      toast.error("Please sign in first.");
      router.replace("/login");
      return;
    }

    // Call Supabase enroll API
    supabase.auth.mfa
      .enroll({
        factorType: "totp",
        issuer: "Prestige Box",
        friendlyName: user.email || "Prestige Box User",
      })
      .then(({ data, error }) => {
        if (error) {
          console.error("Enrollment error:", error);
          toast.error("Failed to generate MFA setup keys. Try again.");
          setIsEnrolling(false);
          return;
        }

        setFactorId(data.id);
        if (data.totp) {
          let qrCodeSrc = data.totp.qr_code;
          if (qrCodeSrc?.startsWith("<svg")) {
            qrCodeSrc = `data:image/svg+xml;utf8,${encodeURIComponent(qrCodeSrc)}`;
          }
          setQrCode(qrCodeSrc);
          setSecret(data.totp.secret);
        }
        setIsEnrolling(false);
      });
  }, [user, isAuthLoading, router]);

  const copyToClipboard = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("Secret key copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || code.length !== 6) return;

    try {
      setIsVerifying(true);

      // Challenge the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      // Verify the challenge
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) throw verifyError;

      toast.success("MFA Enrollment completed successfully!");
      const defaultRoute =
        profile?.role === "admin" || profile?.role === "advisor" ? "/dashboard/crm" : "/dashboard/default";
      router.push(defaultRoute);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Invalid setup code. Please check your authenticator app.");
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isAuthLoading || isEnrolling) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-primary/10 via-transparent to-transparent opacity-50" />
      <div className="relative z-10 w-full max-w-lg space-y-6 rounded-2xl border border-border bg-card/60 p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
            <QrCode className="h-10 w-10 animate-pulse" />
          </div>
          <h1 className="font-bold text-2xl tracking-tight">Set Up Two-Factor Authentication</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Enabling MFA secures your client portal and financial reports.
          </p>
        </div>

        <div className="space-y-4">
          <div className="font-medium text-sm">1. Scan this QR code in your authenticator app:</div>
          {qrCode && (
            <div className="flex justify-center rounded-xl border border-border bg-white p-4">
              {/* biome-ignore lint/performance/noImgElement: QR code is dynamic SVG data URI */}
              <img src={qrCode} alt="Authenticator QR Code" className="h-44 w-44 object-contain" />
            </div>
          )}

          <div className="font-medium text-sm">Or enter this manual secret key:</div>
          <div className="flex select-all items-center justify-between space-x-2 rounded-lg border border-border bg-muted p-3 font-mono text-xs">
            <span className="max-w-[280px] truncate">{secret}</span>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-4 pt-2">
          <div className="font-medium text-sm">2. Enter the 6-digit code shown in your app to activate:</div>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={(val) => setCode(val)} disabled={isVerifying}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button type="submit" className="w-full font-semibold" disabled={isVerifying || code.length !== 6}>
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activating factor...
              </>
            ) : (
              "Verify and Activate"
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground text-xs hover:text-foreground"
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
          >
            Cancel and Log Out
          </Button>
        </form>
      </div>
    </div>
  );
}
