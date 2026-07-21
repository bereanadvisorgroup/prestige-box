"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, Home, Pencil, Trash2, Users } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import type { Household } from "@/types/crm";

export const columns = (onDelete: (household: Household) => void): ColumnDef<Household>[] => [
  {
    accessorKey: "name",
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Household Name" />,
    cell: ({ row }: { row: Row<Household> }) => {
      const household = row.original;
      return (
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/dashboard/crm/households/${household.id}`}
            className="flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <span>{household.name}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "headAndSpouse",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Head & Spouse" />,
    cell: ({ row }: { row: Row<Household> }) => {
      const text = row.original.headAndSpouse || "—";
      return (
        <div className="flex items-center gap-1.5 font-medium text-sm">
          <Users className="h-4 w-4 shrink-0 text-primary/70" />
          <span>{text}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "dependentCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Dependents" />,
    cell: ({ row }: { row: Row<Household> }) => {
      const count = row.original.dependentCount ?? 0;
      return (
        <div className="flex items-center gap-1 font-medium text-sm">
          <span>{count}</span>
        </div>
      );
    },
  },
  {
    id: "memberCount",
    header: "Total Members",
    cell: ({ row }: { row: Row<Household> }) => {
      const count =
        row.original.totalMembersCount ?? (row.original.members?.length || row.original.memberIds?.length || 0);
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <span>{count}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date Created",
    cell: ({ row }: { row: Row<Household> }) => {
      const date = row.original.createdAt;
      return date ? new Date(date).toLocaleDateString() : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<Household> }) => {
      const household = row.original;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/crm/households/${household.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive/80"
            onClick={() => onDelete(household)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
