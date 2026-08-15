"use client";

import Link from "next/link";

import { Sparkles, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getLatestRelease, isReleaseNew } from "@/data/releases";
import { cn } from "@/lib/utils";

export function SidebarVersion() {
  const { state, isMobile } = useSidebar();
  const latestRelease = getLatestRelease();
  const isNew = isReleaseNew(latestRelease.date, 7);
  const isCollapsed = state === "collapsed" && !isMobile;

  const versionText = `v${latestRelease.version}`;

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard/release-notes"
              className={cn(
                "relative mx-auto flex size-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/80 hover:text-foreground",
                isNew && "border-primary/40 bg-primary/5 text-primary",
              )}
              aria-label={`Release Notes: ${versionText}${isNew ? " (New)" : ""}`}
            >
              {isNew ? <Sparkles className="size-4 animate-pulse text-primary" /> : <Tag className="size-3.5" />}
              {isNew && (
                <span className="absolute -top-0.5 -right-0.5 flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" className="flex items-center gap-1.5 font-medium">
            <span>Release Notes ({versionText})</span>
            {isNew && (
              <Badge variant="default" className="h-4 px-1 text-[9px] uppercase tracking-wider">
                New
              </Badge>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex w-full items-center justify-end px-2 py-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard/release-notes"
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium font-mono text-[11px] text-muted-foreground/80 tracking-tight transition-all hover:bg-muted/70 hover:text-foreground",
                isNew && "text-foreground",
              )}
            >
              {isNew ? (
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="size-3 text-amber-500 transition-transform group-hover:scale-110" />
                  <span className="font-semibold text-foreground">{versionText}</span>
                  <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.2 font-bold font-sans text-[10px] text-amber-600 uppercase tracking-wide dark:text-amber-400">
                    New
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <Tag className="size-3 opacity-60 group-hover:opacity-100" />
                  <span>{versionText}</span>
                </span>
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" align="end" className="text-xs">
            <p>
              Release Notes & Changelog ({versionText}){isNew ? " • Updated recently" : ""}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
