"use client";

import { useCallback, useEffect, useState } from "react";

import { CheckCircle2, Fingerprint, KeyRound, Loader2, Shield, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase.client";
import { useAuthStore } from "@/stores/auth.store";

type Factor = {
  id: string;
  factor_type: string;
  friendly_name?: string;
  status: string;
};

export default function SettingsPage() {
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [isFactorsLoading, setIsFactorsLoading] = useState(true);
  const [isPasskeyRegistering, setIsPasskeyRegistering] = useState(false);

  const fetchFactors = useCallback(async () => {
    try {
      setIsFactorsLoading(true);
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors(data?.all || []);
    } catch (err: unknown) {
      console.error("Failed to load factors:", err);
      const error = err as { message?: string };
      toast.error(error.message || "Failed to fetch MFA factors.");
    } finally {
      setIsFactorsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && user) {
      fetchFactors();
    }
  }, [user, isAuthLoading, fetchFactors]);

  const handleRegisterPasskey = async () => {
    try {
      setIsPasskeyRegistering(true);
      const { error } = await supabase.auth.registerPasskey();
      if (error) throw error;
      toast.success("Passkey registered successfully!");
    } catch (err: unknown) {
      console.error("Passkey registration failed:", err);
      const error = err as { name?: string; message?: string };
      toast.error(error.message || "Passkey registration failed or cancelled.");
    } finally {
      setIsPasskeyRegistering(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl tracking-tight">Security Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account credentials, devices, and multi-factor authentication methods.
        </p>
      </header>

      <div className="grid gap-6">
        {/* Passkeys Configuration */}
        <Card className="border border-border/80 bg-card/50 backdrop-blur-xs">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Fingerprint className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Passkeys</CardTitle>
              <CardDescription>
                Sign in securely using biometric recognition (FaceID/TouchID) or physical security keys.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Passkeys offer an alternative to passwords, allowing passwordless login that resists phishing.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4">
              <div className="space-y-1">
                <span className="font-semibold text-sm">Register a new device</span>
                <p className="text-muted-foreground text-xs">Enable quick logins from this browser or hardware key.</p>
              </div>
              <Button onClick={handleRegisterPasskey} disabled={isPasskeyRegistering} className="font-semibold">
                {isPasskeyRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering Key...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Register Passkey
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Multi-Factor Authentication Configuration */}
        <Card className="border border-border/80 bg-card/50 backdrop-blur-xs">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Multi-Factor Authentication (MFA)</CardTitle>
              <CardDescription>
                Add an extra layer of protection by requiring a second verification method.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <span className="font-semibold text-sm">Registered Auth Factors</span>
              {isFactorsLoading ? (
                <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading factors...</span>
                </div>
              ) : factors.length === 0 ? (
                <p className="text-muted-foreground text-sm italic">No factors registered.</p>
              ) : (
                <div className="space-y-2">
                  {factors.map((factor) => (
                    <div
                      key={factor.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-semibold text-sm capitalize">{factor.factor_type} Authenticator</div>
                          <div className="text-[10px] text-muted-foreground">
                            Name: {factor.friendly_name || "Unnamed"} • Status: {factor.status}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-green-600 text-xs dark:text-green-500">
                        <CheckCircle2 className="h-4 w-4" />
                        Active
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4">
              <div className="space-y-1">
                <span className="font-semibold text-sm">Add a second authenticator</span>
                <p className="font-light text-muted-foreground text-xs">
                  Set up an extra verification device for security redundancy.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.assign("/auth/mfa-enroll")}
                className="font-semibold"
              >
                Enroll TOTP Authenticator
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
