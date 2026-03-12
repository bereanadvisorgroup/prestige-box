"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal, MapPin, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Address } from "@/types/crm";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

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
    id: "actions",
    cell: ({ row }: { row: Row<Address> }) => {
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
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(address)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
