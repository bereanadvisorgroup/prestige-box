"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, Pencil, Trash2 } from "lucide-react";

import { PersonAvatar } from "@/components/features/crm/person-avatar";
import { DataTableColumnHeader } from "@/components/features/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPersonPhotoUrl } from "@/lib/social";
import { cn, formatPersonName, formatPhoneNumber } from "@/lib/utils";
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
    accessorFn: (row) => formatPersonName(row),
    filterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue) return true;
      const term = filterValue.toLowerCase().trim();
      const person = row.original;

      // 1. Name search
      const fullName = formatPersonName(person).toLowerCase();
      const goesBy = (person.goesBy || "").toLowerCase();
      if (fullName.includes(term) || goesBy.includes(term)) return true;

      // 2. Email search
      const emails = (person.emails || []).map((e) => (e.address || "").toLowerCase());
      if (emails.some((e) => e.includes(term))) return true;

      // 3. Phone search (matches formatted string or cleaned digits)
      const cleanDigits = term.replace(/\D/g, "");
      const phones = (person.phones || []).map((p) => p.number || "");
      if (
        phones.some((p) => {
          if (p.toLowerCase().includes(term)) return true;
          if (cleanDigits && p.replace(/\D/g, "").includes(cleanDigits)) return true;
          return false;
        })
      ) {
        return true;
      }

      // 4. Tags search
      const tags = (person.tags || []).map((t) => t.toLowerCase());
      if (tags.some((t) => t.includes(term))) return true;

      return false;
    },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }: { row: Row<EnrichedPerson> }) => {
      const person = row.original;
      const name = row.getValue("name") as string;
      return (
        <div className="flex items-center gap-2">
          <PersonAvatar
            photoUrl={getPersonPhotoUrl(person)}
            firstName={person.firstName}
            lastName={person.lastName}
            goesBy={person.goesBy}
          />
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
    id: "contact",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
    cell: ({ row }: { row: Row<EnrichedPerson> }) => {
      const email = row.original.emails?.find((e) => e.isPrimary)?.address || row.original.emails?.[0]?.address;
      const phone = row.original.phones?.find((p) => p.isPrimary)?.number || row.original.phones?.[0]?.number;

      if (!email && !phone) {
        return <span className="text-muted-foreground/45 text-xs italic">N/A</span>;
      }

      return (
        <div className="flex flex-col gap-0.5 text-xs">
          {email && (
            <span className="max-w-[220px] truncate font-medium text-foreground" title={email}>
              {email}
            </span>
          )}
          {phone && <span className="text-muted-foreground">{formatPhoneNumber(phone)}</span>}
        </div>
      );
    },
  },
  {
    id: "tags",
    accessorFn: (row) => (row.tags || []).join(", "),
    filterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue || filterValue === "all") return true;
      const tags = (row.original.tags || []).map((t) => t.toLowerCase());
      return tags.includes((filterValue as string).toLowerCase());
    },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tags" />,
    cell: ({ row }: { row: Row<EnrichedPerson> }) => {
      const tags = row.original.tags || [];
      if (tags.length === 0) {
        return <span className="text-muted-foreground/45 text-xs italic">None</span>;
      }

      return (
        <div className="flex max-w-[220px] flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-secondary/70 px-1.5 py-0.5 font-normal text-[11px] text-secondary-foreground leading-tight"
            >
              {tag}
            </Badge>
          ))}
        </div>
      );
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
