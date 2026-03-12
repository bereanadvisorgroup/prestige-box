"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal, FileText, Edit, Trash2, Shield, User, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientPolicy } from "@/types/crm";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export const columns = (onDelete: (policy: ClientPolicy) => void) => [
  {
    accessorKey: "clientName",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }: { row: Row<any> }) => (
      <div className="flex flex-col">
        <span className="font-semibold text-primary">{row.original.clientName}</span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-tighter">
          <User className="h-2.5 w-2.5" />
          Client Profile
        </span>
      </div>
    )
  },
  {
    accessorKey: "carrierName",
    header: "Carrier",
    cell: ({ row }: { row: Row<any> }) => (
      <div className="flex items-center gap-2">
        <Shield className="h-3 w-3 text-primary" />
        <span className="text-sm font-medium">{row.original.carrierName}</span>
      </div>
    )
  },
  {
    accessorKey: "policyName",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Policy Details" />,
    cell: ({ row }: { row: Row<ClientPolicy> }) => (
      <div className="flex flex-col">
        <span className="text-sm font-bold">{row.original.policyName}</span>
        <span className="text-[10px] font-mono text-muted-foreground">{row.original.policyNumber}</span>
      </div>
    )
  },
  {
    accessorKey: "premiumAmount",
    header: "Premium",
    cell: ({ row }: { row: Row<ClientPolicy> }) => (
      <div className="flex flex-col">
        <span className="font-bold text-green-700">{formatCurrency(row.original.premiumAmount)}</span>
        <Badge variant="outline" className="w-fit text-[8px] py-0 h-3 uppercase scale-90 origin-left">
          {row.original.paymentSchedule}
        </Badge>
      </div>
    )
  },
  {
    accessorKey: "renewalDate",
    header: "Renewal",
    cell: ({ row }: { row: Row<ClientPolicy> }) => {
      const renewal = new Date(row.original.renewalDate);
      const today = new Date();
      const diffMonths = (renewal.getFullYear() - today.getFullYear()) * 12 + (renewal.getMonth() - today.getMonth());
      
      const isSoon = diffMonths <= 2;
      const isPast = renewal < today;

      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {renewal.toLocaleDateString()}
          </div>
          {isPast ? (
            <Badge variant="destructive" className="w-fit text-[8px] py-0 h-3 shadow-none">EXPIRED</Badge>
          ) : isSoon ? (
            <Badge variant="secondary" className="w-fit text-[8px] py-0 h-3 bg-amber-100 text-amber-700 shadow-none">RENEWAL SOON</Badge>
          ) : null}
        </div>
      );
    }
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<ClientPolicy> }) => {
      const policy = row.original;

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
              <Link href={`/dashboard/crm/policies/${policy.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit Policy
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(policy)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Policy
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
