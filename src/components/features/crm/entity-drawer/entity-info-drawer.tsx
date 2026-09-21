"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ArrowUpRight, Building2, Loader2 } from "lucide-react";

import { type ClientDrawerData, type CompanyDrawerData, getEntityDrawerData } from "@/actions/entity-drawer";
import { FirmLogo } from "@/components/features/crm/firm-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompanyLogoUrl } from "@/lib/social";
import { formatPersonLegalName, formatPersonName } from "@/lib/utils";
import { useEntityDrawerStore } from "@/stores/entity-drawer.store";

import { ClientDrawerContent } from "./client-drawer-content";
import { CompanyDrawerContent } from "./company-drawer-content";

export function EntityInfoDrawer() {
  const { isOpen, entityType, entityId, closeDrawer } = useEntityDrawerStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ClientDrawerData | CompanyDrawerData | null>(null);

  useEffect(() => {
    if (!isOpen || !entityType || !entityId) {
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await getEntityDrawerData(entityType, entityId);
        if (!cancelled) {
          if (res.success) {
            setData(res.data);
          } else {
            setError(res.error || "Failed to load entity details");
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An unexpected error occurred");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, entityType, entityId]);

  const clientName = data?.entityType === "client" ? formatPersonName(data.person, "Client Profile") : "";
  const legalName = data?.entityType === "client" ? formatPersonLegalName(data.person) : null;
  const clientInitials =
    data?.entityType === "client"
      ? `${data.person?.firstName?.[0] || ""}${data.person?.lastName?.[0] || ""}`.toUpperCase()
      : "CL";

  const companyName = data?.entityType === "company" ? data.company.name : "";
  const navigationHref =
    entityType === "client" ? `/dashboard/crm/clients/${entityId}` : `/dashboard/crm/companies/${entityId}`;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col gap-0 border-l bg-background shadow-2xl"
      >
        {/* Drawer Header */}
        <SheetHeader className="border-b bg-muted/20 px-6 py-5 shrink-0">
          {loading ? (
            <div className="flex items-center gap-4">
              <SheetTitle className="sr-only">Loading contact details</SheetTitle>
              <Skeleton className="h-16 w-16 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ) : error ? (
            <div>
              <SheetTitle className="text-destructive text-lg font-bold">Error Loading Details</SheetTitle>
              <SheetDescription className="text-muted-foreground text-sm mt-1">{error}</SheetDescription>
            </div>
          ) : data?.entityType === "client" ? (
            <div className="flex items-center justify-between gap-4 pr-6">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <Avatar className="h-16 w-16 border-2 border-primary/10 shrink-0">
                  {data.person?.photoUrl && (
                    <AvatarImage src={data.person.photoUrl} alt={clientName} className="object-cover" />
                  )}
                  <AvatarFallback className="bg-primary/5 text-xl font-semibold text-primary">
                    {clientInitials || "CL"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <SheetTitle className="font-bold text-xl tracking-tight truncate">{clientName}</SheetTitle>
                    <Link
                      href={navigationHref}
                      onClick={() => closeDrawer()}
                      className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted shrink-0"
                      title="Navigate to Client Profile"
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </Link>
                  </div>
                  {legalName && (
                    <p className="mt-0.5 text-xs text-muted-foreground font-normal truncate">{legalName}</p>
                  )}
                </div>
              </div>
            </div>
          ) : data?.entityType === "company" ? (
            <div className="flex items-center justify-between gap-4 pr-6">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <FirmLogo
                  logoUrl={getCompanyLogoUrl(data.company)}
                  name={companyName}
                  className="h-16 w-16 rounded-md border-2 border-primary/10 shrink-0"
                  size="lg"
                  fallbackIcon={<Building2 className="h-8 w-8" />}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <SheetTitle className="font-bold text-xl tracking-tight truncate">{companyName}</SheetTitle>
                    <Link
                      href={navigationHref}
                      onClick={() => closeDrawer()}
                      className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted shrink-0"
                      title="Navigate to Company Profile"
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <SheetTitle>Contact Information</SheetTitle>
              <SheetDescription>View entity details</SheetDescription>
            </div>
          )}
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-6 pt-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="space-y-2 border-t pt-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-56" />
              </div>
              <div className="space-y-2 border-t pt-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="space-y-2 border-t pt-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-16 w-full rounded-md" />
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <p className="text-sm">{error}</p>
            </div>
          ) : data?.entityType === "client" ? (
            <ClientDrawerContent person={data.person} addresses={data.addresses} />
          ) : data?.entityType === "company" ? (
            <CompanyDrawerContent company={data.company} address={data.address} advisor={data.advisor} />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
