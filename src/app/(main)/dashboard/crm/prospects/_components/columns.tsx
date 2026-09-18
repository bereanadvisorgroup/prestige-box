"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, Flame, Pencil, Snowflake, Sun, Trash2, UserCheck } from "lucide-react";

import { DataTableColumnHeader } from "@/components/features/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatPhoneNumber } from "@/lib/utils";
import type { EnrichedProspect, ProspectStage } from "@/types/prospects";

export const getStageBadgeStyle = (stage: ProspectStage) => {
  switch (stage) {
    case "New":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/60";
    case "Contacted":
      return "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60";
    case "Qualified":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60";
    case "Appt Scheduled":
      return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/60";
    case "Closed Won":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60";
    case "Closed Lost":
      return "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60";
    default:
      return "bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 border-slate-200";
  }
};

export const getScoreBadge = (score: number, temp?: "Cold" | "Warm" | "Hot") => {
  const temperature = temp || (score >= 70 ? "Hot" : score >= 30 ? "Warm" : "Cold");

  if (temperature === "Hot") {
    return (
      <Badge
        variant="outline"
        className="flex items-center gap-1 border-rose-200/60 bg-rose-50 px-2 py-0.5 font-semibold text-rose-700 text-xs dark:bg-rose-950/40 dark:text-rose-300"
      >
        <Flame className="h-3 w-3 fill-rose-500 text-rose-500" />
        <span>{score} (Hot)</span>
      </Badge>
    );
  }

  if (temperature === "Warm") {
    return (
      <Badge
        variant="outline"
        className="flex items-center gap-1 border-amber-200/60 bg-amber-50 px-2 py-0.5 font-medium text-amber-700 text-xs dark:bg-amber-950/40 dark:text-amber-300"
      >
        <Sun className="h-3 w-3 text-amber-500" />
        <span>{score} (Warm)</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1 border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 text-xs dark:bg-slate-900/40 dark:text-slate-400"
    >
      <Snowflake className="h-3 w-3 text-slate-400" />
      <span>{score} (Cold)</span>
    </Badge>
  );
};

export const columns = (
  onEdit: (prospect: EnrichedProspect) => void,
  onConvert: (prospect: EnrichedProspect) => void,
  onDelete: (prospect: EnrichedProspect) => void,
): ColumnDef<EnrichedProspect>[] => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "name",
      accessorFn: (row) =>
        [row.prefix, row.firstName, row.middleName, row.lastName, row.suffix].filter(Boolean).join(" ") ||
        `${row.firstName} ${row.lastName}`.trim(),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Prospect Name" />,
      cell: ({ row }: { row: Row<EnrichedProspect> }) => {
        const prospect = row.original;
        const displayName =
          [prospect.prefix, prospect.firstName, prospect.middleName, prospect.lastName, prospect.suffix]
            .filter(Boolean)
            .join(" ") || `${prospect.firstName} ${prospect.lastName}`.trim();

        return (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs">
              {prospect.firstName[0] || ""}
              {prospect.lastName[0] || ""}
            </div>
            <div className="flex flex-col">
              <Link
                href={`/dashboard/crm/prospects/${prospect.id}`}
                className="flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <span>{displayName}</span>
                {prospect.goesBy && (
                  <span className="font-normal text-[11px] text-muted-foreground italic">({prospect.goesBy})</span>
                )}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
              </Link>
              {prospect.jobTitle && <span className="text-[11px] text-muted-foreground">{prospect.jobTitle}</span>}
            </div>
          </div>
        );
      },
    },
    {
      id: "company",
      accessorKey: "company",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
      cell: ({ row }) => {
        const company = row.original.company;
        return company ? (
          <span className="font-medium text-foreground text-sm">{company}</span>
        ) : (
          <span className="text-muted-foreground/45 text-xs italic">N/A</span>
        );
      },
    },
    {
      id: "contact",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
      cell: ({ row }) => {
        const { email, phone } = row.original;
        if (!email && !phone) {
          return <span className="text-muted-foreground/45 text-xs italic">N/A</span>;
        }
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            {email && (
              <span className="max-w-[200px] truncate font-medium text-foreground" title={email}>
                {email}
              </span>
            )}
            {phone && <span className="text-muted-foreground">{formatPhoneNumber(phone)}</span>}
          </div>
        );
      },
    },
    {
      id: "stage",
      accessorKey: "stage",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
      cell: ({ row }) => {
        const stage = row.original.stage;
        return (
          <Badge variant="outline" className={cn("border px-2 py-0.5 font-medium text-xs", getStageBadgeStyle(stage))}>
            {stage}
          </Badge>
        );
      },
    },
    {
      id: "score",
      accessorKey: "score",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
      cell: ({ row }) => {
        const score = row.original.score ?? 0;
        const temp = row.original.scoreTemperature;
        const breakdown = row.original.scoreBreakdown;

        const badge = getScoreBadge(score, temp);

        if (breakdown && breakdown.length > 0) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>{badge}</TooltipTrigger>
                <TooltipContent className="max-w-xs space-y-1 p-2 text-xs">
                  <p className="font-semibold">Score Breakdown:</p>
                  {breakdown.map((b) => (
                    <div key={`${b.ruleName}-${b.points}`} className="flex justify-between gap-3 text-[11px]">
                      <span className="text-muted-foreground">{b.ruleName}</span>
                      <span className={b.points >= 0 ? "font-medium text-emerald-500" : "font-medium text-rose-500"}>
                        {b.points > 0 ? `+${b.points}` : b.points}
                      </span>
                    </div>
                  ))}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return badge;
      },
    },
    {
      id: "campaign",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Source / Campaign" />,
      cell: ({ row }) => {
        const { source, primaryCampaignName } = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <Badge variant="secondary" className="w-fit px-1.5 py-0 text-[10px]">
              {source || "Direct"}
            </Badge>
            {primaryCampaignName && (
              <span className="max-w-[150px] truncate text-[11px] text-muted-foreground" title={primaryCampaignName}>
                {primaryCampaignName}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "assignedRep",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned Rep" />,
      cell: ({ row }) => {
        const rep = row.original.assignedRepName;
        return rep ? (
          <span className="text-foreground text-xs">{rep}</span>
        ) : (
          <span className="text-muted-foreground/45 text-xs italic">Unassigned</span>
        );
      },
    },
    {
      id: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client Status" />,
      cell: ({ row }) => {
        const isConverted = !!row.original.convertedClientId;
        if (isConverted) {
          return (
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <Link
                href={`/dashboard/crm/clients/${row.original.convertedClientId}`}
                className="flex items-center gap-1 hover:underline"
              >
                <span>Client</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Badge>
          );
        }
        return <span className="text-muted-foreground/50 text-xs">Prospect</span>;
      },
    },
    {
      id: "actions",
      cell: ({ row }: { row: Row<EnrichedProspect> }) => {
        const prospect = row.original;
        const isConverted = !!prospect.convertedClientId;
        const isDeletable = !prospect.isLinked && !isConverted;

        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Convert to Client button */}
            {!isConverted && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50"
                      onClick={() => onConvert(prospect)}
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Convert to Client</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Edit button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onEdit(prospect)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Prospect</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Delete button (conditionally disabled) */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {isDeletable ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(prospect)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-not-allowed text-muted-foreground/40"
                      disabled
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TooltipTrigger>
                <TooltipContent>{isDeletable ? "Delete Prospect" : "Cannot delete: converted to client"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];
