"use client";

import Link from "next/link";

import type { Row } from "@tanstack/react-table";
import { Building2, Edit, ExternalLink, Eye, MoreHorizontal, Phone, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPhoneNumber } from "@/lib/utils";
import type { Company } from "@/types/crm";

export const columns = (onDelete: (company: Company) => void) => [
  {
    accessorKey: "name",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Company Name" />,
    cell: ({ row }: { row: Row<Company> }) => {
      const company = row.original;
      return (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Link href={`/dashboard/crm/companies/${company.id}`} className="font-medium text-primary hover:underline">
            {company.name}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "website",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Website" />,
    cell: ({ row }: { row: Row<Company> }) => {
      const website = row.original.website;
      if (!website) return "-";
      return (
        <a 
          href={website.startsWith('http') ? website : `https://${website}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          {website.replace(/^https?:\/\//, '')}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Phone" />,
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
    id: "clientsCount",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Associated Clients" />,
    cell: ({ row }: { row: Row<Company> }) => {
      const count = row.original.clientIds?.length || 0;
      return <span className="text-sm">{count} {count === 1 ? 'Client' : 'Clients'}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<Company> }) => {
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
              <Link href={`/dashboard/crm/companies/${company.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/crm/companies/${company.id}/edit`}>
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
