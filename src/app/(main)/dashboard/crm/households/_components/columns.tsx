"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal, Home, Edit, Trash2, Eye, Users } from "lucide-react";
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
import { Household } from "@/types/crm";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const columns = (onDelete: (household: Household) => void) => [
  {
    accessorKey: "name",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Household Name" />,
  },
  {
    id: "memberCount",
    header: "Members",
    cell: ({ row }: { row: Row<Household> }) => {
      const count = row.original.memberIds.length;
      return (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
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
              <Link href={`/dashboard/crm/households/${household.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/crm/households/${household.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(household)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
