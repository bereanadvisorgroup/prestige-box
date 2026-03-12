"use client";

import Link from "next/link";

import type { Row } from "@tanstack/react-table";
import { Edit, Globe, List, MoreHorizontal, Shield, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InsuranceCompany } from "@/types/crm";

export const columns = (onDelete: (company: InsuranceCompany) => void) => [
  {
    accessorKey: "name",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Company Name" />,
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
    cell: ({ row }: { row: Row<InsuranceCompany> }) => {
      const company = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/admin/insurance-companies/${company.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(company)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
