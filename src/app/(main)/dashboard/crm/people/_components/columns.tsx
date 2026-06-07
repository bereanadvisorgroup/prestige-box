"use client";

import Link from "next/link";

import type { Row } from "@tanstack/react-table";
import { ArrowUpRight, Pencil, Trash2, User } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { formatPhoneNumber } from "@/lib/utils";
import type { Person } from "@/types/crm";

export type EnrichedPerson = Person & {
  isLinked?: boolean;
};

export const columns = (onDelete: (person: Person) => void) => [
  {
    accessorKey: "name",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }: { row: Row<EnrichedPerson> }) => {
      const person = row.original;
      const name = `${person.firstName} ${person.lastName}`;
      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/dashboard/crm/people/${person.id}`}
            className="flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <span>{name}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    id: "email",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }: { row: Row<Person> }) => {
      const email =
        row.original.emails?.find((e) => e.isPrimary)?.address || row.original.emails?.[0]?.address || "N/A";
      return <span>{email}</span>;
    },
  },
  {
    id: "mobilePhone",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }: { row: Row<Person> }) => {
      const phone = row.original.phones?.find((p) => p.isPrimary)?.number || row.original.phones?.[0]?.number;
      return <span>{formatPhoneNumber(phone) || "N/A"}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<EnrichedPerson> }) => {
      const person = row.original;
      const isDeletable = !person.isLinked;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/crm/people/${person.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {isDeletable ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => onDelete(person)}
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
