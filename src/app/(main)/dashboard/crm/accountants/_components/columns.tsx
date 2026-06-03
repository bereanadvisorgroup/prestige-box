"use client";

import Link from "next/link";

import type { Row } from "@tanstack/react-table";
import { Edit, Eye, MapPin, MoreHorizontal, ReceiptText, Trash2 } from "lucide-react";

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
import type { Accountant, Address, Person } from "@/types/crm";

export const columns = (onDelete: (accountant: Accountant) => void) => [
  {
    accessorKey: "person",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }: { row: Row<Accountant & { person?: Person }> }) => {
      const accountant = row.original;
      const name = accountant.person ? `${accountant.person.firstName} ${accountant.person.lastName}` : "Unknown";
      return (
        <div className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/dashboard/crm/accountants/${accountant.id}`}
            className="font-medium text-primary hover:underline"
          >
            {name}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "firmName",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Firm Name" />,
    cell: ({ row }: { row: Row<Accountant> }) => {
      return <span className="text-sm">{row.original.firmName}</span>;
    },
  },
  {
    accessorKey: "address",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Firm Address" />,
    cell: ({ row }: { row: Row<Accountant & { address?: Address }> }) => {
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
    cell: ({ row }: { row: Row<Accountant> }) => {
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
    cell: ({ row }: { row: Row<Accountant> }) => {
      const accountant = row.original;

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
              <Link href={`/dashboard/crm/accountants/${accountant.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/crm/accountants/${accountant.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(accountant)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
