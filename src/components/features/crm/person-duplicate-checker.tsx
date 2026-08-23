"use client";

import { useEffect, useState } from "react";

import { AlertTriangle, ArrowUpRight, ChevronDown, ChevronUp, Mail, Phone } from "lucide-react";

import { type DuplicatePersonMatch, findDuplicatePeople } from "@/actions/people";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFullName } from "@/lib/utils";

import { PersonAvatar } from "./person-avatar";

interface PersonDuplicateCheckerProps {
  firstName?: string | null;
  lastName?: string | null;
  excludePersonId?: string | null;
  className?: string;
}

export function PersonDuplicateChecker({
  firstName = "",
  lastName = "",
  excludePersonId,
  className = "",
}: PersonDuplicateCheckerProps) {
  const [duplicates, setDuplicates] = useState<DuplicatePersonMatch[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const cleanFirst = (firstName || "").trim();
    const cleanLast = (lastName || "").trim();

    if (!cleanFirst || !cleanLast || cleanFirst.length < 2 || cleanLast.length < 2) {
      setDuplicates([]);
      setIsChecking(false);
      return;
    }

    let isMounted = true;
    setIsChecking(true);

    const timer = setTimeout(async () => {
      try {
        const res = await findDuplicatePeople({
          firstName: cleanFirst,
          lastName: cleanLast,
          excludePersonId: excludePersonId || undefined,
        });

        if (isMounted) {
          if (res.success && res.duplicates) {
            setDuplicates(res.duplicates);
            if (res.duplicates.length > 0) {
              setIsCollapsed(false);
            }
          } else {
            setDuplicates([]);
          }
        }
      } catch (error) {
        console.error("Duplicate person check error:", error);
        if (isMounted) setDuplicates([]);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [firstName, lastName, excludePersonId]);

  if (duplicates.length === 0 && !isChecking) {
    return null;
  }

  if (isChecking && duplicates.length === 0) {
    return (
      <div className="fade-in-50 flex animate-in items-center gap-2 py-1 text-muted-foreground text-xs duration-200">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>Checking for matching records...</span>
      </div>
    );
  }

  if (duplicates.length === 0) {
    return null;
  }

  return (
    <section
      className={`rounded-xl border border-amber-300/60 bg-amber-50/50 p-4 shadow-xs transition-all duration-300 dark:border-amber-900/40 dark:bg-amber-950/20 ${className}`}
      aria-label="Duplicate person warning"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-amber-950 text-sm dark:text-amber-200">
                Possible Duplicate Record{duplicates.length > 1 ? "s" : ""} Detected
              </h4>
              <Badge
                variant="outline"
                className="border-amber-400/50 bg-amber-100/80 px-1.5 py-0 font-medium text-[11px] text-amber-900 dark:bg-amber-900/50 dark:text-amber-200"
              >
                {duplicates.length} match{duplicates.length > 1 ? "es" : ""}
              </Badge>
            </div>
            <p className="text-amber-800/80 text-xs dark:text-amber-300/70">
              Found existing person record{duplicates.length > 1 ? "s" : ""} with a matching or nickname-equivalent
              name.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 gap-1 text-amber-900 text-xs hover:bg-amber-100/80 hover:text-amber-950 dark:text-amber-300 dark:hover:bg-amber-900/40"
        >
          {isCollapsed ? (
            <>
              Show details <ChevronDown className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Hide details <ChevronUp className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="mt-3 space-y-2.5 border-amber-200/70 border-t pt-3 dark:border-amber-900/40">
          <div className="divide-y divide-amber-200/50 rounded-lg border border-amber-200/60 bg-background/80 dark:divide-amber-900/30 dark:border-amber-900/40 dark:bg-card/90">
            {duplicates.map((dup) => {
              const fullName = formatFullName(dup.firstName, dup.lastName, dup.suffix, "Unnamed Person", dup.goesBy);
              return (
                <div
                  key={dup.id}
                  className="flex flex-col gap-3 p-3 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <PersonAvatar
                      photoUrl={dup.photoUrl}
                      firstName={dup.firstName}
                      lastName={dup.lastName}
                      goesBy={dup.goesBy}
                      size="sm"
                      className="border border-border/40"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{fullName}</span>
                        {dup.isExactMatch ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-300/80 bg-emerald-50 text-[10px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          >
                            Exact Match
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-sky-300/80 bg-sky-50 text-[10px] text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                          >
                            Nickname Match ({dup.inputName} ↔ {dup.matchedName})
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
                        {dup.primaryEmail ? (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 opacity-70" />
                            {dup.primaryEmail}
                          </span>
                        ) : null}
                        {dup.primaryPhone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 opacity-70" />
                            {dup.primaryPhone}
                          </span>
                        ) : null}
                        {!dup.primaryEmail && !dup.primaryPhone && (
                          <span className="text-muted-foreground/70 italic">No direct contact info listed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center self-end sm:self-center">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2.5 text-xs shadow-none hover:border-primary/50 hover:bg-primary/5"
                    >
                      <a
                        href={`/dashboard/crm/people/${dup.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Review existing person profile in a new tab"
                      >
                        <span>View Profile</span>
                        <ArrowUpRight className="h-3 w-3 opacity-70" />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Tip: Reviewing existing profiles helps avoid duplicate contact histories. If this is a different individual,
            you may continue completing and submitting this form.
          </p>
        </div>
      )}
    </section>
  );
}
