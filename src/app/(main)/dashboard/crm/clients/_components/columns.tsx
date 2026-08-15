"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, Pencil, Trash2 } from "lucide-react";

import { PersonAvatar } from "@/components/features/crm/person-avatar";
import { DataTableColumnHeader } from "@/components/features/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPersonName, formatPhoneNumber } from "@/lib/utils";
import type { Client, Person } from "@/types/crm";

export type EnrichedClient = Client & {
  isLinked?: boolean;
  person?: Person | null;
  advisorName?: string | null;
};

export const columns = (onDelete: (client: Client) => void): ColumnDef<EnrichedClient>[] => [
  {
    id: "personName",
    accessorFn: (row) => formatPersonName(row.person, ""),
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client Name" />,
    cell: ({ row }: { row: Row<EnrichedClient> }) => {
      const person = row.original.person;
      if (!person) return "-";
      return (
        <div className="flex items-center gap-2">
          <PersonAvatar photoUrl={person.photoUrl} firstName={person.firstName} lastName={person.lastName} />
          <Link
            href={`/dashboard/crm/clients/${row.original.id}`}
            className="flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <span>{formatPersonName(person)}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    id: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }: { row: Row<EnrichedClient> }) => {
      const person = row.original.person;
      if (!person) return "-";
      const email = person.emails?.find((e) => e.isPrimary)?.address || person.emails?.[0]?.address;
      if (!email) return "-";
      return <span className="text-sm">{email}</span>;
    },
  },
  {
    id: "phone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }: { row: Row<EnrichedClient> }) => {
      const person = row.original.person;
      if (!person) return "-";
      const phone = person.phones?.find((p) => p.isPrimary)?.number || person.phones?.[0]?.number;
      if (!phone) return "-";
      return <span className="whitespace-nowrap text-sm">{formatPhoneNumber(phone)}</span>;
    },
  },
  {
    id: "assignedAdvisor",
    accessorFn: (row) => row.advisorName ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned Advisor" />,
    cell: ({ row }: { row: Row<EnrichedClient> }) => {
      const name = row.original.advisorName;
      if (!name) return <span className="text-muted-foreground text-sm italic">Unassigned</span>;
      return <span className="whitespace-nowrap text-sm">{name}</span>;
    },
  },
  {
    accessorKey: "hobbies",
    header: "Hobbies",
    cell: ({ row }: { row: Row<Client> }) => {
      const hobbies = row.original.hobbies;
      return (
        <div className="flex max-w-[200px] flex-wrap gap-1">
          {hobbies.slice(0, 2).map((hobby, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="h-4 border-muted-foreground/20 bg-muted/50 px-1 py-0 text-[10px]"
            >
              {hobby}
            </Badge>
          ))}
          {hobbies.length > 2 && (
            <Badge variant="outline" className="h-4 px-1 py-0 text-[10px]">
              +{hobbies.length - 2}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "sportsTeams",
    header: "Sports Teams",
    cell: ({ row }: { row: Row<Client> }) => {
      const teams = row.original.favoriteSportsTeams;
      return (
        <div className="flex max-w-[200px] flex-wrap gap-1">
          {teams.slice(0, 2).map((team, i) => (
            <Badge key={i} variant="default" className="h-4 px-1 py-0 text-[10px]">
              {team}
            </Badge>
          ))}
          {teams.length > 2 && (
            <Badge variant="outline" className="h-4 px-1 py-0 text-[10px]">
              +{teams.length - 2}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<EnrichedClient> }) => {
      const client = row.original;
      const isDeletable = !client.isLinked;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/crm/clients/${client.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {isDeletable ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => onDelete(client)}
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
