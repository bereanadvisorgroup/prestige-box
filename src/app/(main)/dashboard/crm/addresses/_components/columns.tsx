"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, MapPin, Pencil, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import type { Address } from "@/types/crm";

export type EnrichedAddress = Address & {
  linkedPeople?: { id: string; name: string; type: string }[];
  isLinked?: boolean;
};

export const columns = (onDelete: (address: Address) => void): ColumnDef<EnrichedAddress>[] => [
  {
    accessorKey: "street1",
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Street Address" />,
    cell: ({ row }: { row: Row<EnrichedAddress> }) => {
      const address = row.original;
      return (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/dashboard/crm/addresses/${address.id}`}
            className="flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <span>{address.street1}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "city",
    header: ({ column }) => <DataTableColumnHeader column={column} title="City" />,
  },
  {
    accessorKey: "state",
    header: ({ column }) => <DataTableColumnHeader column={column} title="State" />,
  },
  {
    accessorKey: "zipCode",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Zip Code" />,
  },
  {
    accessorKey: "linkedPeople",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Associated People" />,
    cell: ({ row }: { row: Row<EnrichedAddress> }) => {
      const people = row.original.linkedPeople || [];
      if (people.length === 0) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="flex flex-col gap-1">
          {people.map((p) => (
            <span key={`${p.id}-${p.type}`} className="text-sm">
              {p.name} - {p.type}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<EnrichedAddress> }) => {
      const address = row.original;
      const isDeletable = !address.isLinked;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/crm/addresses/${address.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {isDeletable ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => onDelete(address)}
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
