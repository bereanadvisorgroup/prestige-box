import Link from "next/link";

import { ArrowLeft, Mail, Phone, ShieldAlert } from "lucide-react";

import { getBusinessContact } from "@/actions/settings";
import { Button } from "@/components/ui/button";

export const revalidate = 0; // Dynamic rendering

export default async function NoAccountPage() {
  const result = await getBusinessContact();
  const email = result.success ? result.email : "info@prestigeadvisors360.com";
  const phone = result.success ? result.phone : "941-799-3300";

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-primary/10 via-transparent to-transparent opacity-50" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/60 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-3 text-destructive">
            <ShieldAlert className="h-10 w-10 animate-pulse" />
          </div>
          <h1 className="font-extrabold text-2xl tracking-tight">Access Denied</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            We couldn't find a whitelisted portal account matching your email address.
          </p>
        </div>

        <div className="mb-6 space-y-4 rounded-lg border border-border/40 bg-muted/40 p-4">
          <p className="text-center font-semibold text-foreground text-sm">Please contact our office for assistance:</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-primary" />
              <a href={`mailto:${email}`} className="font-medium text-foreground hover:underline">
                {email}
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-primary" />
              <a href={`tel:${phone}`} className="font-medium text-foreground hover:underline">
                {phone}
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full font-semibold" variant="default">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </div>

        <div className="mt-6 text-center text-muted-foreground text-xs">
          Automatic registration is disabled for safety and security.
        </div>
      </div>
    </div>
  );
}
