"use client";

import Link from "next/link";

import type { Row } from "@tanstack/react-table";
import { ArrowUpRight, Globe, List, Pencil, Shield, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InsuranceCompany } from "@/types/crm";

export type EnrichedInsuranceCompany = InsuranceCompany & {
  isLinked?: boolean;
};

export const columns = (onDelete: (company: InsuranceCompany) => void) => [
  {
    accessorKey: "name",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Company Name" />,
    cell: ({ row }: { row: Row<EnrichedInsuranceCompany> }) => {
      const company = row.original;
      return (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/dashboard/admin/insurance-companies/${company.id}`}
            className="font-medium text-primary hover:underline flex items-center gap-1"
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
    cell: ({ row }: { row: Row<InsuranceCompany> }) => {
      const url = row.original.websiteUrl;
      if (!url) return "-";
      return (
        <a
          href={url.startsWith("http") ? url : `https://${url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:underline font-semibold"
        >
          <Globe className="h-3 w-3" />
          {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
        </a>
      );
    },
  },
  {
    id: "policies",
    header: "Policies",
    cell: ({ row }: { row: Row<InsuranceCompany> }) => {
      const policies = row.original.policyNames;
      return (
        <div className="flex flex-wrap gap-1 max-w-[300px]">
          {policies.slice(0, 3).map((policy, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0 h-4">
              {policy}
            </Badge>
          ))}
          {policies.length > 3 && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
              +{policies.length - 3} more
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<EnrichedInsuranceCompany> }) => {
      const company = row.original;
      const isDeletable = !company.isLinked;

      return (
        <div className="flex items-center gap-2 justify-end">
          <Link href={`/dashboard/admin/insurance-companies/${company.id}/edit`}>
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
