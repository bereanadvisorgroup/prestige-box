"use client";

import Link from "next/link";

import type { Row } from "@tanstack/react-table";
import { Edit, Eye, MapPin, MoreHorizontal, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Address } from "@/types/crm";

export type EnrichedAddress = Address & {
  linkedPeople?: { id: string; name: string; type: string }[];
};

export const columns = (onDelete: (address: Address) => void) => [
  {
    accessorKey: "street1",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Street Address" />,
  },
  {
    accessorKey: "city",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="City" />,
  },
  {
    accessorKey: "state",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="State" />,
  },
  {
    accessorKey: "zipCode",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Zip Code" />,
  },
  {
    accessorKey: "linkedPeople",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Associated People" />,
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

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/crm/addresses/${address.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/crm/addresses/${address.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(address)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
