"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, ExternalLink, Pencil, Phone, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { formatPhoneNumber } from "@/lib/utils";
import type { LawFirm } from "@/types/crm";

export type EnrichedLawFirm = LawFirm & {
  isLinked?: boolean;
};

export const columns = (onDelete: (lawFirm: LawFirm) => void): ColumnDef<LawFirm>[] => [
  {
    accessorKey: "firmName",
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Firm Name" />,
    cell: ({ row }: { row: Row<LawFirm> }) => {
      const lawFirm = row.original;
      return (
        <Link
          href={`/dashboard/crm/law-firms/${lawFirm.id}`}
          className="flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <span className="truncate">{lawFirm.firmName}</span>
          <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
        </Link>
      );
    },
  },

  {
    accessorKey: "phone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone Number" />,
    cell: ({ row }: { row: Row<LawFirm> }) => {
      const phone = row.original.phone;
      if (!phone) return "-";
      return (
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-3 w-3 text-muted-foreground" />
          <span className="whitespace-nowrap">{formatPhoneNumber(phone)}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "website",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Website" />,
    cell: ({ row }: { row: Row<LawFirm> }) => {
      const website = row.original.website;
      if (!website) return "-";
      return (
        <a
          href={website.startsWith("http") ? website : `https://${website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800 hover:underline"
        >
          {website.replace(/^https?:\/\//, "")}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    },
  },
  {
    id: "clientsCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Clients" />,
    cell: ({ row }: { row: Row<LawFirm> }) => {
      const count = row.original.clientIds?.length || 0;
      return (
        <span className="text-sm">
          {count} {count === 1 ? "Client" : "Clients"}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<EnrichedLawFirm> }) => {
      const lawFirm = row.original;
      const isDeletable = !lawFirm.isLinked;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/crm/law-firms/${lawFirm.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {isDeletable ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => onDelete(lawFirm)}
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
