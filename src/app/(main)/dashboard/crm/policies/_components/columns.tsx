"use client";

import Link from "next/link";

import type { Row } from "@tanstack/react-table";
import { ArrowUpRight, Calendar, DollarSign, FileText, Pencil, Shield, Trash2, User } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { ClientPolicy } from "@/types/crm";

export const columns = (onDelete: (policy: ClientPolicy) => void) => [
  {
    accessorKey: "clientName",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }: { row: Row<any> }) => (
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <Link
            href={`/dashboard/crm/policies/${row.original.id}`}
            className="font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>{row.original.clientName}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-tighter">
          <User className="h-2.5 w-2.5" />
          Policy Client
        </span>
      </div>
    ),
  },
  {
    accessorKey: "carrierName",
    header: "Carrier",
    cell: ({ row }: { row: Row<any> }) => (
      <div className="flex items-center gap-2">
        <Shield className="h-3 w-3 text-primary" />
        <span className="text-sm font-medium">{row.original.carrierName}</span>
      </div>
    ),
  },
  {
    accessorKey: "policyName",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Policy Details" />,
    cell: ({ row }: { row: Row<ClientPolicy> }) => (
      <div className="flex flex-col">
        <Link href={`/dashboard/crm/policies/${row.original.id}`} className="hover:underline">
          <span className="text-sm font-bold text-foreground">{row.original.policyName}</span>
        </Link>
        <span className="text-[10px] font-mono text-muted-foreground">{row.original.policyNumber}</span>
      </div>
    ),
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
    ),
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
            <Badge variant="destructive" className="w-fit text-[8px] py-0 h-3 shadow-none">
              EXPIRED
            </Badge>
          ) : isSoon ? (
            <Badge variant="secondary" className="w-fit text-[8px] py-0 h-3 bg-amber-100 text-amber-700 shadow-none">
              RENEWAL SOON
            </Badge>
          ) : null}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<ClientPolicy> }) => {
      const policy = row.original;

      return (
        <div className="flex items-center gap-2 justify-end">
          <Link href={`/dashboard/crm/policies/${policy.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive/80"
            onClick={() => onDelete(policy)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
