"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowRight, Building2, User } from "lucide-react";

import { DataTableColumnHeader } from "@/components/features/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import type { ChangeHistoryAction, ChangeHistoryWithEntity } from "@/types/crm";

const ACTION_STYLES: Record<ChangeHistoryAction, string> = {
  created: "bg-emerald-100 text-emerald-700 border-emerald-200",
  added: "bg-emerald-100 text-emerald-700 border-emerald-200",
  updated: "bg-amber-100 text-amber-700 border-amber-200",
  removed: "bg-rose-100 text-rose-700 border-rose-200",
  deleted: "bg-rose-100 text-rose-700 border-rose-200",
};

function truncate(value: string | null | undefined, max = 60): string {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function ValueChange({ row }: { row: Row<ChangeHistoryWithEntity> }) {
  const { action, oldValue, newValue, summary } = row.original;
  if (action === "updated") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground line-through">{truncate(oldValue)}</span>
        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="font-medium">{truncate(newValue)}</span>
      </div>
    );
  }
  if (action === "added" || action === "created") {
    return <span className="text-sm">{truncate(newValue ?? summary)}</span>;
  }
  // removed / deleted: show the old value, plus "→ REMOVED" when a marker is present.
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground line-through">{truncate(oldValue ?? summary)}</span>
      {newValue && (
        <>
          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="font-medium text-rose-600">{truncate(newValue)}</span>
        </>
      )}
    </div>
  );
}

const entityColumn: ColumnDef<ChangeHistoryWithEntity> = {
  accessorKey: "entityName",
  header: ({ column }) => <DataTableColumnHeader column={column} title="Record" />,
  cell: ({ row }: { row: Row<ChangeHistoryWithEntity> }) => {
    const { entityType, entityId, entityName } = row.original;
    const href =
      entityType === "client" ? `/dashboard/crm/clients/${entityId}` : `/dashboard/crm/companies/${entityId}`;
    const Icon = entityType === "client" ? User : Building2;
    return (
      <Link href={href} className="flex items-center gap-2 decoration-primary/50 underline-offset-4 hover:underline">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{entityName || "(deleted)"}</span>
      </Link>
    );
  },
  // Used by the report's entity-type filter.
  filterFn: (row, _id, value: string) => value === "all" || row.original.entityType === value,
};

const baseColumns: ColumnDef<ChangeHistoryWithEntity>[] = [
  {
    accessorKey: "changedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }: { row: Row<ChangeHistoryWithEntity> }) => {
      const raw = row.original.changedAt;
      if (!raw) return <span className="text-muted-foreground text-sm">—</span>;
      const d = new Date(raw);
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{format(d, "MMM d, yyyy")}</span>
          <span className="text-muted-foreground text-xs">{format(d, "h:mm a")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "subType",
    header: "Category",
    cell: ({ row }: { row: Row<ChangeHistoryWithEntity> }) => (
      <Badge variant="outline" className="font-normal">
        {row.original.subType}
      </Badge>
    ),
    filterFn: (row, _id, value: string) => value === "all" || row.original.subType === value,
  },
  {
    accessorKey: "summary",
    header: "Change",
    cell: ({ row }: { row: Row<ChangeHistoryWithEntity> }) => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`h-5 px-1.5 text-[10px] uppercase ${ACTION_STYLES[row.original.action]}`}>
            {row.original.action}
          </Badge>
          <span className="font-medium text-sm">{row.original.fieldLabel ?? row.original.summary}</span>
        </div>
        <ValueChange row={row} />
      </div>
    ),
  },
  {
    accessorKey: "actorName",
    header: "Changed By",
    cell: ({ row }: { row: Row<ChangeHistoryWithEntity> }) => (
      <span className="text-sm">{row.original.actorName ?? "System"}</span>
    ),
  },
];

/** Builds the history columns. Pass showEntity for the cross-entity report view. */
export function getHistoryColumns(showEntity: boolean): ColumnDef<ChangeHistoryWithEntity>[] {
  if (!showEntity) return baseColumns;
  // Insert the entity column right after the date column.
  return [baseColumns[0], entityColumn, ...baseColumns.slice(1)];
}
