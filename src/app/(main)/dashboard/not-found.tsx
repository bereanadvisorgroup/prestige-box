"use client";

import Link from "next/link";

import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";

export default function DashboardNotFound() {
  const { profile } = useAuthStore();
  const defaultRoute =
    profile?.role === "admin" || profile?.role === "advisor" ? "/dashboard/crm" : "/dashboard/default";

  return (
    <div className="flex min-h-[500px] w-full flex-col items-center justify-center space-y-6 px-4 py-16 text-center">
      <div className="fade-in zoom-in-95 flex h-20 w-20 animate-in items-center justify-center rounded-2xl border border-muted bg-muted/20 text-muted-foreground shadow-xs duration-500">
        <FileQuestion className="h-10 w-10 text-muted-foreground/80" />
      </div>

      <div className="max-w-md space-y-2">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">Resource not found</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The page or user profile you are looking for could not be found or does not exist. It may have been deleted,
          or the URL may be incorrect.
        </p>
      </div>

      <div className="fade-in slide-in-from-bottom-3 animate-in pt-2 delay-200 duration-500">
        <Button variant="outline" asChild className="shadow-xs transition-all hover:bg-accent">
          <Link prefetch={false} replace href={defaultRoute}>
            Go back home
          </Link>
        </Button>
      </div>
    </div>
  );
}
