"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, Pencil, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/features/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TagWithCount } from "@/types/crm";

export const columns = (onDelete: (tag: TagWithCount) => void): ColumnDef<TagWithCount>[] => [
  {
    accessorKey: "name",
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tag Name" />,
    cell: ({ row }: { row: Row<TagWithCount> }) => {
      const tag = row.original;
      const effectiveColor = tag.color || "#64748B";

      return (
        <div className="flex items-center gap-2.5">
          <span
            className="h-3 w-3 shrink-0 rounded-full border border-black/10 shadow-2xs dark:border-white/20"
            style={{ backgroundColor: effectiveColor }}
          />
          <Link
            href={`/dashboard/admin/people-tags/${tag.id}`}
            className="flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <span>{tag.name}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "color",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Color" />,
    cell: ({ row }: { row: Row<TagWithCount> }) => {
      const tag = row.original;
      const effectiveColor = tag.color || "#64748B";

      return (
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium text-xs shadow-2xs"
            style={{
              backgroundColor: `${effectiveColor}14`,
              borderColor: `${effectiveColor}40`,
              color: effectiveColor,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: effectiveColor }} />
            <span className="font-mono text-[11px] uppercase">{effectiveColor}</span>
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "peopleCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="People Assigned" />,
    cell: ({ row }: { row: Row<TagWithCount> }) => {
      const count = row.original.peopleCount ?? 0;
      return (
        <Badge
          variant="outline"
          className={
            count > 0
              ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
              : "bg-muted text-muted-foreground"
          }
        >
          {count} {count === 1 ? "person" : "people"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }: { row: Row<TagWithCount> }) => {
      const val = row.original.createdAt;
      if (!val) return "-";
      return <span className="text-muted-foreground text-sm">{new Date(val).toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<TagWithCount> }) => {
      const tag = row.original;
      const isDeletable = !tag.isLinked;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/admin/people-tags/${tag.id}/edit`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              title="Edit tag"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {isDeletable ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => onDelete(tag)}
              title="Delete tag"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-not-allowed text-muted-foreground/40"
              disabled
              title={`Cannot delete tag linked to ${tag.peopleCount} ${tag.peopleCount === 1 ? "person" : "people"}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];
