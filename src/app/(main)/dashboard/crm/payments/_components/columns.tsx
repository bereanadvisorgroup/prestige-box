"use client";

import Link from "next/link";

import type { Row } from "@tanstack/react-table";
import { Calendar, CreditCard, DollarSign, FileText, Shield, User } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";

export const columns = [
  {
    accessorKey: "clientName",
    header: ({ column }: any) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }: { row: Row<any> }) => (
      <Link
        href={`/dashboard/crm/clients/${row.original.clientId}`}
        className="flex items-center gap-2 hover:underline decoration-primary/50 underline-offset-4"
      >
        <User className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium text-black">{row.original.clientName}</span>
      </Link>
    ),
  },
  {
    accessorKey: "paymentAccountName",
    header: "Account",
    cell: ({ row }: { row: Row<any> }) => (
      <div className="flex items-center gap-2">
        <CreditCard className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">{row.original.paymentAccountName}</span>
      </div>
    ),
  },
  {
    accessorKey: "carrierName",
    header: "Carrier",
    cell: ({ row }: { row: Row<any> }) => (
      <div className="flex items-center gap-2">
        <Shield className="h-3 w-3 text-primary" />
        <span className="text-sm">{row.original.carrierName}</span>
      </div>
    ),
  },
  {
    accessorKey: "policyName",
    header: "Policy",
    cell: ({ row }: { row: Row<any> }) => (
      <Link
        href={`/dashboard/crm/policies/${row.original.policyId}`}
        className="flex flex-col hover:underline decoration-primary/50 underline-offset-4"
      >
        <span className="text-sm font-medium">{row.original.policyName}</span>
        <span className="text-[10px] text-muted-foreground font-mono">{row.original.policyNumber}</span>
      </Link>
    ),
  },
  {
    accessorKey: "paymentAmount",
    header: "Amount Due",
    cell: ({ row }: { row: Row<any> }) => (
      <div className="flex items-center font-bold text-green-700">
        <DollarSign className="h-3 w-3" />
        {row.original.paymentAmount.toLocaleString()}
        <Badge variant="outline" className="ml-2 text-[8px] h-3 px-1 uppercase scale-90 origin-left">
          {row.original.paymentSchedule}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "paymentDate",
    header: "Due Date",
    cell: ({ row }: { row: Row<any> }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">{new Date(row.original.paymentDate).toLocaleDateString()}</span>
      </div>
    ),
  },
];
