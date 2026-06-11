"use client";

import Link from "next/link";

import type { Row } from "@tanstack/react-table";
import { ArrowUpRight, GraduationCap, MapPin, Pencil, Trash2 } from "lucide-react";

import { PersonAvatar } from "@/components/crm/person-avatar";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Address, Lawyer, Person } from "@/types/crm";

export type EnrichedLawyer = Lawyer & {
  isLinked?: boolean;
};

export const columns = (onDelete: (lawyer: Lawyer) => void) => [
  {
    accessorKey: "firmName",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Firm Name" />,
    cell: ({ row }: { row: Row<Lawyer> }) => {
      return <span className="text-sm">{row.original.firmName}</span>;
    },
  },
  {
    accessorKey: "people",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }: { row: Row<EnrichedLawyer & { people?: Person[] }> }) => {
      const lawyer = row.original;
      const people = lawyer.people || [];
      const names = people.length > 0 ? people.map((p) => `${p.firstName} ${p.lastName}`).join(", ") : "Unknown";
      return (
        <div className="flex items-center gap-2">
          <AvatarGroup>
            {people.slice(0, 3).map((person) => (
              <PersonAvatar
                key={person.id}
                photoUrl={person.photoUrl}
                firstName={person.firstName}
                lastName={person.lastName}
                size="sm"
                fallbackIcon={<GraduationCap className="h-3 w-3 text-muted-foreground" />}
              />
            ))}
            {people.length > 3 && (
              <AvatarGroupCount className="text-[10px] font-bold">+{people.length - 3}</AvatarGroupCount>
            )}
          </AvatarGroup>
          <Link
            href={`/dashboard/crm/lawyers/${lawyer.id}`}
            className="flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <span className="max-w-[200px] truncate">{names}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "address",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Firm Address" />,
    cell: ({ row }: { row: Row<Lawyer & { address?: Address }> }) => {
      const address = row.original.address;
      if (!address) return "-";
      return (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <MapPin className="h-3 w-3" />
          <span className="max-w-[200px] truncate">
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
        <div className="flex items-center justify-end gap-2">
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
