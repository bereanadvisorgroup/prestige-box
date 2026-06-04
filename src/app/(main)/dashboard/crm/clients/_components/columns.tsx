"use client";

import Link from "next/link";

import type { Row } from "@tanstack/react-table";
import { ArrowUpRight, Heart, Pencil, Trash2, Trophy, User } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPhoneNumber } from "@/lib/utils";
import type { Client } from "@/types/crm";

export type EnrichedClient = Client & {
  isLinked?: boolean;
};

export const columns = (onDelete: (client: Client) => void) => [
  {
    id: "personName",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Client Name" />,
    cell: ({ row }: { row: Row<any> }) => {
      const person = row.original.person;
      if (!person) return "-";
      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/dashboard/crm/clients/${row.original.id}`}
            className="font-medium text-primary hover:underline flex items-center gap-1"
          >
            <span>
              {person.firstName} {person.lastName}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    id: "email",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }: { row: Row<any> }) => {
      const person = row.original.person;
      if (!person?.email) return "-";
      return <span className="text-sm">{person.email}</span>;
    },
  },
  {
    id: "phone",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }: { row: Row<any> }) => {
      const person = row.original.person;
      if (!person?.mobilePhone) return "-";
      return <span className="text-sm whitespace-nowrap">{formatPhoneNumber(person.mobilePhone)}</span>;
    },
  },
  {
    accessorKey: "hobbies",
    header: "Hobbies",
    cell: ({ row }: { row: Row<Client> }) => {
      const hobbies = row.original.hobbies;
      return (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {hobbies.slice(0, 2).map((hobby, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="text-[10px] px-1 py-0 h-4 bg-muted/50 border-muted-foreground/20"
            >
              {hobby}
            </Badge>
          ))}
          {hobbies.length > 2 && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
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
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {teams.slice(0, 2).map((team, i) => (
            <Badge key={i} variant="default" className="text-[10px] px-1 py-0 h-4">
              {team}
            </Badge>
          ))}
          {teams.length > 2 && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
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
        <div className="flex items-center gap-2 justify-end">
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
