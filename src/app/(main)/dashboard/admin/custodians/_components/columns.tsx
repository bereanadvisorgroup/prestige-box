"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, Pencil, ShieldCheck, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import type { Custodian } from "@/types/crm";

export type EnrichedCustodian = Custodian & {
  isLinked?: boolean;
};

export const columns = (onDelete: (custodian: Custodian) => void): ColumnDef<EnrichedCustodian>[] => [
  {
    accessorKey: "name",
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Custodian Name" />,
    cell: ({ row }: { row: Row<EnrichedCustodian> }) => {
      const custodian = row.original;
      return (
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/dashboard/admin/custodians/${custodian.id}`}
            className="flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <span>{custodian.name}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }: { row: Row<EnrichedCustodian> }) => {
      const val = row.original.createdAt;
      if (!val) return "-";
      return <span className="text-sm">{new Date(val).toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
    cell: ({ row }: { row: Row<EnrichedCustodian> }) => {
      const val = row.original.updatedAt;
      if (!val) return "-";
      return <span className="text-sm">{new Date(val).toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<EnrichedCustodian> }) => {
      const custodian = row.original;
      const isDeletable = !custodian.isLinked;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/admin/custodians/${custodian.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {isDeletable ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => onDelete(custodian)}
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
        </div>
      );
    },
  },
];
