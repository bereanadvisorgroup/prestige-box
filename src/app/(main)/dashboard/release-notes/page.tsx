"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Wrench,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getReleases, isReleaseNew, type ReleaseCategory, type ReleaseItem } from "@/data/releases";
import { cn } from "@/lib/utils";

type FilterCategory = "all" | ReleaseCategory;

const CATEGORY_CONFIG: Record<
  ReleaseCategory,
  {
    label: string;
    icon: typeof Sparkles;
    badgeVariant: "default" | "secondary" | "outline" | "destructive";
    badgeClass: string;
  }
> = {
  feature: {
    label: "Feature",
    icon: Sparkles,
    badgeVariant: "default",
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/15",
  },
  improvement: {
    label: "Improvement",
    icon: Zap,
    badgeVariant: "secondary",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 hover:bg-blue-500/15",
  },
  fix: {
    label: "Bug Fix",
    icon: Wrench,
    badgeVariant: "outline",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 hover:bg-amber-500/15",
  },
  security: {
    label: "Security",
    icon: ShieldCheck,
    badgeVariant: "destructive",
    badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 hover:bg-purple-500/15",
  },
};

export default function ReleaseNotesPage() {
  const releases = useMemo(() => getReleases(), []);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedVersion, setCopiedVersion] = useState<string | null>(null);

  const handleCopyLink = (version: string) => {
    const url = `${window.location.origin}${window.location.pathname}#v${version}`;
    navigator.clipboard.writeText(url);
    setCopiedVersion(version);
    toast.success(`Copied link to version ${version}`);
    setTimeout(() => setCopiedVersion(null), 2000);
  };

  const filteredReleases = useMemo(() => {
    return releases
      .map((release) => {
        let items = release.items;

        if (selectedCategory !== "all") {
          items = items.filter((item) => item.category === selectedCategory);
        }

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          items = items.filter(
            (item) =>
              item.text.toLowerCase().includes(query) ||
              item.detail?.toLowerCase().includes(query) ||
              release.title.toLowerCase().includes(query) ||
              release.version.toLowerCase().includes(query),
          );
        }

        return {
          ...release,
          items,
        };
      })
      .filter((release) => {
        if (!searchQuery.trim() && selectedCategory === "all") return true;
        return release.items.length > 0;
      });
  }, [releases, selectedCategory, searchQuery]);

  return (
    <TooltipProvider delayDuration={150}>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-6">
        {/* Top Breadcrumb / Return Link */}
        <nav aria-label="Breadcrumb">
          <Link
            href="/dashboard/crm"
            className="inline-flex items-center gap-1.5 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </nav>

        {/* Page Header */}
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="font-bold text-3xl tracking-tight">Release Notes</h1>
                <Badge variant="outline" className="gap-1 font-mono font-semibold text-xs uppercase tracking-wider">
                  <Tag className="size-3 text-primary" />v{releases[0]?.version || "1.0.0"}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Explore the latest features, enhancements, and fixes across the Prestige Box platform.
              </p>
            </div>
          </div>
        </header>

        <Separator />

        {/* Search & Category Filter Toolbar */}
        <section
          aria-label="Filter release notes"
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              className="h-8 font-medium text-xs"
              onClick={() => setSelectedCategory("all")}
            >
              All Changes
            </Button>
            <Button
              variant={selectedCategory === "feature" ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 font-medium text-xs"
              onClick={() => setSelectedCategory("feature")}
            >
              <Sparkles className="size-3 text-emerald-500" />
              Features
            </Button>
            <Button
              variant={selectedCategory === "improvement" ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 font-medium text-xs"
              onClick={() => setSelectedCategory("improvement")}
            >
              <Zap className="size-3 text-blue-500" />
              Improvements
            </Button>
            <Button
              variant={selectedCategory === "fix" ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 font-medium text-xs"
              onClick={() => setSelectedCategory("fix")}
            >
              <Wrench className="size-3 text-amber-500" />
              Fixes
            </Button>
            <Button
              variant={selectedCategory === "security" ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 font-medium text-xs"
              onClick={() => setSelectedCategory("security")}
            >
              <ShieldCheck className="size-3 text-purple-500" />
              Security
            </Button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search release notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </section>

        {/* Releases Timeline */}
        <section aria-label="Releases timeline" className="relative space-y-8 pl-2 sm:pl-4">
          {/* Vertical Timeline Guide Line */}
          <div className="absolute top-4 bottom-4 left-4 w-px bg-border/80 sm:left-6" aria-hidden="true" />

          {filteredReleases.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
              <Layers className="mb-3 size-10 text-muted-foreground/50" />
              <h3 className="font-semibold text-base">No matching updates found</h3>
              <p className="mt-1 mb-4 max-w-sm text-muted-foreground text-xs">
                No release items match your current search query or category filter.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            filteredReleases.map((release, index) => {
              const isLatest = index === 0 && selectedCategory === "all" && !searchQuery.trim();
              const isNew = isReleaseNew(release.date, 7);
              const formattedDate = format(parseISO(release.date), "MMMM d, yyyy");

              return (
                <article
                  key={release.version}
                  id={`v${release.version}`}
                  className="relative scroll-mt-20 pl-7 sm:pl-10"
                >
                  {/* Timeline Node Dot */}
                  <div
                    className={cn(
                      "absolute top-4 left-2.5 size-3.5 -translate-x-1/2 rounded-full border-2 border-background bg-muted-foreground/40 transition-colors sm:left-4.5",
                      isLatest && "size-4 border-background bg-primary ring-4 ring-primary/20",
                    )}
                    aria-hidden="true"
                  />

                  {/* Release Card */}
                  <Card
                    className={cn(
                      "border border-border/80 bg-card/60 backdrop-blur-xs transition-shadow hover:shadow-md",
                      isLatest && "border-primary/30 shadow-xs",
                    )}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={isLatest ? "default" : "secondary"}
                            className="px-2.5 py-0.5 font-mono font-semibold text-xs"
                          >
                            v{release.version}
                          </Badge>
                          {isLatest && (
                            <Badge
                              variant="outline"
                              className="border-primary/40 bg-primary/10 font-semibold text-[10px] text-primary uppercase tracking-wide"
                            >
                              Latest
                            </Badge>
                          )}
                          {isNew && (
                            <Badge
                              variant="outline"
                              className="gap-1 border-amber-500/40 bg-amber-500/10 font-semibold text-[10px] text-amber-600 uppercase tracking-wide dark:text-amber-400"
                            >
                              <Sparkles className="size-2.5 text-amber-500" />
                              New Release
                            </Badge>
                          )}
                        </div>

                        {/* Release Date & Share Anchor */}
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            <time dateTime={release.date}>{formattedDate}</time>
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-foreground"
                                onClick={() => handleCopyLink(release.version)}
                                aria-label={`Copy link to version ${release.version}`}
                              >
                                {copiedVersion === release.version ? (
                                  <Check className="size-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="size-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <span>Copy version link</span>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <CardTitle className="mt-2 font-bold text-xl tracking-tight">{release.title}</CardTitle>
                      <CardDescription className="pt-1 text-muted-foreground text-xs leading-relaxed">
                        {release.summary}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      {/* Milestone Highlights (if any) */}
                      {release.highlights && release.highlights.length > 0 && (
                        <div className="space-y-2 rounded-lg border border-primary/15 bg-primary/5 p-3 sm:p-4">
                          <h4 className="font-semibold text-primary text-xs uppercase tracking-wider">
                            Key Highlights
                          </h4>
                          <ul className="grid gap-1.5 text-foreground/90 text-xs sm:grid-cols-2">
                            {release.highlights.map((highlight) => (
                              <li key={highlight} className="flex items-start gap-2">
                                <span className="mt-0.5 text-primary">•</span>
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Categorized Change Items */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                          Changelog & Details
                        </h4>
                        <div className="divide-y divide-border/50 rounded-lg border border-border/70 bg-background/50">
                          {release.items.map((item: ReleaseItem) => {
                            const categoryConfig = CATEGORY_CONFIG[item.category];
                            const IconComp = categoryConfig.icon;

                            return (
                              <div
                                key={`${release.version}-${item.category}-${item.text}`}
                                className="flex flex-col gap-1.5 p-3.5 sm:flex-row sm:items-start sm:gap-3"
                              >
                                <div className="shrink-0 pt-0.5">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "gap-1 px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wide",
                                      categoryConfig.badgeClass,
                                    )}
                                  >
                                    <IconComp className="size-2.5" />
                                    {categoryConfig.label}
                                  </Badge>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="font-medium text-foreground text-xs">{item.text}</p>
                                  {item.detail && (
                                    <p className="text-muted-foreground text-xs leading-relaxed">{item.detail}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </article>
              );
            })
          )}
        </section>
      </main>
    </TooltipProvider>
  );
}
