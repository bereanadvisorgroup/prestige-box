"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, Globe, Pencil, Phone, Shield, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPhoneNumber } from "@/lib/utils";
import type { LongTermCareInsurance } from "@/types/crm";

export type EnrichedLongTermCareInsurance = LongTermCareInsurance & {
  isLinked?: boolean;
};

export const columns = (
  onDelete: (company: LongTermCareInsurance) => void,
): ColumnDef<EnrichedLongTermCareInsurance>[] => [
  {
    accessorKey: "name",
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Company Name" />,
    cell: ({ row }: { row: Row<EnrichedLongTermCareInsurance> }) => {
      const company = row.original;
      return (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/dashboard/admin/long-term-care-insurance/${company.id}`}
            className="flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <span>{company.name}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "websiteUrl",
    header: "Website",
    cell: ({ row }: { row: Row<LongTermCareInsurance> }) => {
      const url = row.original.websiteUrl;
      if (!url) return "-";
      return (
        <a
          href={url.startsWith("http") ? url : `https://${url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          <Globe className="h-3 w-3" />
          {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
        </a>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }: { row: Row<LongTermCareInsurance> }) => {
      const phone = row.original.phone;
      if (!phone) return "-";
      return (
        <span className="flex items-center gap-1 font-semibold text-muted-foreground">
          <Phone className="h-3 w-3" />
          {formatPhoneNumber(phone)}
        </span>
      );
    },
  },
  {
    id: "policies",
    header: "Policies",
    cell: ({ row }: { row: Row<LongTermCareInsurance> }) => {
      const policies = row.original.policyNames || [];
      return (
        <div className="flex max-w-[300px] flex-wrap gap-1">
          {policies.slice(0, 3).map((policy, i) => (
            <Badge key={i} variant="secondary" className="h-4 px-1 py-0 text-[10px]">
              {policy}
            </Badge>
          ))}
          {policies.length > 3 && (
            <Badge variant="outline" className="h-4 px-1 py-0 text-[10px]">
              +{policies.length - 3} more
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<EnrichedLongTermCareInsurance> }) => {
      const company = row.original;
      const isDeletable = !company.isLinked;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/admin/long-term-care-insurance/${company.id}/edit`}>
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
