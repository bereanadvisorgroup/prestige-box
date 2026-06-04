"use client";

import Link from "next/link";

import type { Row } from "@tanstack/react-table";
import { ArrowUpRight, GraduationCap, MapPin, Pencil, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import type { Address, Lawyer, Person } from "@/types/crm";

export type EnrichedLawyer = Lawyer & {
  isLinked?: boolean;
};

export const columns = (onDelete: (lawyer: Lawyer) => void) => [
  {
    accessorKey: "person",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }: { row: Row<EnrichedLawyer & { person?: Person }> }) => {
      const lawyer = row.original;
      const name = lawyer.person ? `${lawyer.person.firstName} ${lawyer.person.lastName}` : "Unknown";
      return (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/dashboard/crm/lawyers/${lawyer.id}`}
            className="font-medium text-primary hover:underline flex items-center gap-1"
          >
            <span>{name}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "firmName",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Firm Name" />,
    cell: ({ row }: { row: Row<Lawyer> }) => {
      return <span className="text-sm">{row.original.firmName}</span>;
    },
  },
  {
    accessorKey: "address",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Firm Address" />,
    cell: ({ row }: { row: Row<Lawyer & { address?: Address }> }) => {
      const address = row.original.address;
      if (!address) return "-";
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate max-w-[200px]">
            {address.street1}, {address.city}
          </span>
        </div>
      );
    },
  },
  {
    id: "clientsCount",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Clients" />,
    cell: ({ row }: { row: Row<Lawyer> }) => {
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
    cell: ({ row }: { row: Row<EnrichedLawyer> }) => {
      const lawyer = row.original;
      const isDeletable = !lawyer.isLinked;

      return (
        <div className="flex items-center gap-2 justify-end">
          <Link href={`/dashboard/crm/lawyers/${lawyer.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {isDeletable ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => onDelete(lawyer)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/40 cursor-not-allowed"
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
