"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, Pencil, Tag, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/features/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import type { ReferralType } from "@/types/crm";

export type EnrichedReferralType = ReferralType & {
  isLinked?: boolean;
};

export const columns = (onDelete: (referralType: ReferralType) => void): ColumnDef<EnrichedReferralType>[] => [
  {
    accessorKey: "name",
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Referral Type Name" />,
    cell: ({ row }: { row: Row<EnrichedReferralType> }) => {
      const referralType = row.original;
      return (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/dashboard/admin/referral-types/${referralType.id}`}
            className="flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <span>{referralType.name}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }: { row: Row<EnrichedReferralType> }) => {
      const val = row.original.createdAt;
      if (!val) return "-";
      return <span className="text-sm">{new Date(val).toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
    cell: ({ row }: { row: Row<EnrichedReferralType> }) => {
      const val = row.original.updatedAt;
      if (!val) return "-";
      return <span className="text-sm">{new Date(val).toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<EnrichedReferralType> }) => {
      const referralType = row.original;
      const isDeletable = !referralType.isLinked;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/admin/referral-types/${referralType.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {isDeletable ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => onDelete(referralType)}
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
