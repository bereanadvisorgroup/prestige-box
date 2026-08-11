import Link from "next/link";

import { AlertCircle, ArrowLeft } from "lucide-react";

import { getBusinessContact } from "@/actions/settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { PortalSettingsForm } from "./_components/portal-settings-form";

export const revalidate = 0; // Dynamic rendering

export default async function PortalSettingsPage() {
  const result = await getBusinessContact();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 md:px-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href="/dashboard/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="font-bold text-3xl tracking-tight">Portal Settings</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to load portal settings from the server. Check server logs."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const initialEmail = result.email || "info@prestigeadvisors360.com";
  const initialPhone = result.phone || "941-799-3300";
  const initialWebsite = result.website || "";
  const initialLogoUrl = result.logoUrl || "";
  const initialCompanyName = result.companyName || "Prestige Advisors";
  const initialSocialMediaRaw = result.socialMediaRaw || "[]";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/dashboard/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Portal Settings</h1>
          <p className="text-muted-foreground text-sm">
            Configure contact details, website links, and company branding for the client portal.
          </p>
        </div>
      </div>

      <PortalSettingsForm
        initialEmail={initialEmail}
        initialPhone={initialPhone}
        initialWebsite={initialWebsite}
        initialLogoUrl={initialLogoUrl}
        initialCompanyName={initialCompanyName}
        initialSocialMediaRaw={initialSocialMediaRaw}
      />
    </div>
  );
}
