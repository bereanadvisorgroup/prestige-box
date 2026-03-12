"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal, UserIcon, Edit, Trash2, Eye } from "lucide-react";
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
import { Person } from "@/types/crm";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const columns = (onDelete: (person: Person) => void) => [
  {
    accessorKey: "firstName",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="First Name" />,
  },
  {
    accessorKey: "lastName",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Last Name" />,
  },
  {
    accessorKey: "email",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "mobilePhone",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Phone" />,
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<Person> }) => {
      const person = row.original;

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
              <Link href={`/dashboard/crm/people/${person.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/crm/people/${person.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(person)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
