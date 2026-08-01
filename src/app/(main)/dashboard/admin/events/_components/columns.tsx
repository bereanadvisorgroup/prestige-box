"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, Calendar, MapPin, Pencil, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/features/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import type { Event } from "@/types/crm";

export type EnrichedEvent = Event & {
  address?: {
    street1: string;
    street2?: string | null;
    city: string;
    state: string;
    zipCode: string;
    country?: string | null;
  } | null;
  isLinked?: boolean;
};

export const columns = (onDelete: (event: EnrichedEvent) => void): ColumnDef<EnrichedEvent>[] => [
  {
    accessorKey: "title",
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Event Title" />,
    cell: ({ row }: { row: Row<EnrichedEvent> }) => {
      const event = row.original;
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/dashboard/admin/events/${event.id}`}
            className="flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <span>{event.title}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "address",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
    cell: ({ row }: { row: Row<EnrichedEvent> }) => {
      const address = row.original.address;
      if (!address) return <span className="text-muted-foreground italic text-xs">No address</span>;
      return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
          <span>
            {address.street1}, {address.city}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Start Date" />,
    cell: ({ row }: { row: Row<EnrichedEvent> }) => {
      const val = row.original.startDate;
      if (!val) return "-";
      return <span className="text-sm">{new Date(val).toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: "endDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="End Date" />,
    cell: ({ row }: { row: Row<EnrichedEvent> }) => {
      const val = row.original.endDate;
      if (!val) return "-";
      return <span className="text-sm">{new Date(val).toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<EnrichedEvent> }) => {
      const event = row.original;
      const isDeletable = !event.isLinked;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/admin/events/${event.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {isDeletable ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => onDelete(event)}
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
