"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, Pencil, Trash2 } from "lucide-react";

import { PersonAvatar } from "@/components/features/crm/person-avatar";
import { DataTableColumnHeader } from "@/components/features/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPersonPhotoUrl } from "@/lib/social";
import { cn, formatPhoneNumber } from "@/lib/utils";
import type { Person } from "@/types/crm";

export type RelationLink = {
  type: string;
  name: string;
  href: string;
};

export type EnrichedPerson = Person & {
  isLinked?: boolean;
  relations?: RelationLink[];
};

const getRelationBadgeStyle = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("client") && !t.includes("family")) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-emerald-900/50";
  }
  if (t.includes("family")) {
    return "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200/60 hover:bg-sky-100 hover:text-sky-800 dark:hover:bg-sky-900/50";
  }
  if (t.includes("company")) {
    return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/60 hover:bg-indigo-100 hover:text-indigo-800 dark:hover:bg-indigo-900/50";
  }
  if (t.includes("firm") || t.includes("bank")) {
    return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-amber-900/50";
  }
  if (t.includes("household")) {
    return "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60 hover:bg-purple-100 hover:text-purple-800 dark:hover:bg-purple-900/50";
  }
  if (t.includes("manager") || t.includes("keeper")) {
    return "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 hover:bg-rose-100 hover:text-rose-800 dark:hover:bg-rose-900/50";
  }
  return "bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 border-slate-200 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800/50";
};

export const columns = (onDelete: (person: Person) => void): ColumnDef<EnrichedPerson>[] => [
  {
    id: "name",
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }: { row: Row<EnrichedPerson> }) => {
      const person = row.original;
      const name = row.getValue("name") as string;
      return (
        <div className="flex items-center gap-2">
          <PersonAvatar photoUrl={getPersonPhotoUrl(person)} firstName={person.firstName} lastName={person.lastName} />
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }: { row: Row<Person> }) => {
      const email =
        row.original.emails?.find((e) => e.isPrimary)?.address || row.original.emails?.[0]?.address || "N/A";
      return <span>{email}</span>;
    },
  },
  {
    id: "mobilePhone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }: { row: Row<Person> }) => {
      const phone = row.original.phones?.find((p) => p.isPrimary)?.number || row.original.phones?.[0]?.number;
      return <span>{formatPhoneNumber(phone) || "N/A"}</span>;
    },
  },
  {
    id: "relations",
    accessorFn: (row) => row.relations?.map((r) => r.type).join(", ") || "",
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue || filterValue === "all") return true;
      const relations = row.original.relations || [];
      return relations.some((r) => {
        const type = r.type.toLowerCase();
        const filter = (filterValue as string).toLowerCase();
        if (filter === "family") {
          return type.includes("family");
        }
        if (filter === "company") {
          return type.includes("company");
        }
        if (filter === "insurance") {
          return type.includes("insurance") || type.includes("ltc");
        }
        if (filter === "firm") {
          return type.includes("firm") || type.includes("bank");
        }
        if (filter === "manager") {
          return type.includes("manager") || type.includes("keeper");
        }
        return type.includes(filter);
      });
    },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Relations" />,
    cell: ({ row }: { row: Row<EnrichedPerson> }) => {
      const relations = row.original.relations || [];
      if (relations.length === 0) {
        return <span className="text-muted-foreground/45 text-xs italic">None</span>;
      }

      return (
        <div className="flex max-w-[280px] flex-wrap gap-1 py-0.5">
          {relations.map((rel) => (
            <Badge
              key={`${rel.type}-${rel.href}`}
              variant="outline"
              asChild
              className={cn(
                "border px-2 py-0.5 font-medium text-[10px] leading-tight transition-all duration-200 hover:scale-[1.02] hover:shadow-sm",
                getRelationBadgeStyle(rel.type),
              )}
            >
              <Link href={rel.href}>
                <span className="mr-0.5 font-bold opacity-75">{rel.type}:</span>
                <span className="max-w-[120px] truncate">{rel.name}</span>
              </Link>
            </Badge>
          ))}
        </div>
      );
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
