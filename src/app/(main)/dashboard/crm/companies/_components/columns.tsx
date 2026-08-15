"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, ExternalLink, Pencil, Phone, Trash2 } from "lucide-react";

import { FirmLogo } from "@/components/features/crm/firm-logo";
import { DataTableColumnHeader } from "@/components/features/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { getCompanyLogoUrl } from "@/lib/social";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";
import type { Company } from "@/types/crm";

export type EnrichedCompany = Company & {
  isLinked?: boolean;
  owners?: { id: string }[];
  employees?: { id: string }[];
  advisorName?: string | null;
};

export const columns = (onDelete: (company: Company) => void, role?: string): ColumnDef<EnrichedCompany>[] => [
  {
    accessorKey: "name",
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Company Name" />,
    cell: ({ row }: { row: Row<EnrichedCompany> }) => {
      const company = row.original;
      const isInternal = role === "admin" || role === "advisor";
      const href = isInternal
        ? `/dashboard/crm/companies/${company.id}/internal`
        : `/dashboard/crm/companies/${company.id}`;
      return (
        <div className="flex items-center gap-2">
          <FirmLogo logoUrl={getCompanyLogoUrl(company)} name={company.name} className="h-6 w-6" />
          <Link href={href} className="flex items-center gap-1 font-medium text-primary hover:underline">
            <span>{company.name}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "website",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Website" />,
    cell: ({ row }: { row: Row<Company> }) => {
      const website = row.original.website;
      if (!website) return "-";
      return (
        <a
          href={website.startsWith("http") ? website : `https://${website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800 hover:underline"
        >
          {website.replace(/^https?:\/\//, "")}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }: { row: Row<Company> }) => {
      const phone = row.original.phone;
      if (!phone) return "-";
      return (
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-3 w-3 text-muted-foreground" />
          <span className="whitespace-nowrap">{formatPhoneNumber(phone)}</span>
        </div>
      );
    },
  },
  {
    id: "assignedAdvisor",
    accessorFn: (row) => row.advisorName ?? "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned Advisor" />,
    cell: ({ row }: { row: Row<EnrichedCompany> }) => {
      const name = row.original.advisorName;
      if (!name) return <span className="text-muted-foreground text-sm italic">Unassigned</span>;
      return <span className="whitespace-nowrap text-sm">{name}</span>;
    },
  },
  {
    accessorKey: "estimatedValue",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estimated Value" />,
    cell: ({ row }: { row: Row<EnrichedCompany> }) => {
      const value = row.original.estimatedValue;
      return <span className="font-semibold text-sm">{formatCurrency(Number(value) || 0)}</span>;
    },
  },
  {
    id: "ownersCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Owners" />,
    cell: ({ row }: { row: Row<EnrichedCompany> }) => {
      const count = row.original.owners?.length || 0;
      return (
        <span className="text-sm">
          {count} {count === 1 ? "Owner" : "Owners"}
        </span>
      );
    },
  },
  {
    id: "employeesCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Employees" />,
    cell: ({ row }: { row: Row<EnrichedCompany> }) => {
      const count = row.original.employees?.length || 0;
      return (
        <span className="text-sm">
          {count} {count === 1 ? "Employee" : "Employees"}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<EnrichedCompany> }) => {
      const company = row.original;
      const isDeletable = !company.isLinked;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/crm/companies/${company.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {isDeletable ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => onDelete(company)}
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
