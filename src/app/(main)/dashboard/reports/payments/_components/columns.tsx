"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { Calendar, CreditCard, DollarSign, Shield } from "lucide-react";

import type { ScheduledPayment } from "@/actions/payments";
import { PersonAvatar } from "@/components/features/crm/person-avatar";
import { DataTableColumnHeader } from "@/components/features/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import type { PaymentSchedule } from "@/types/crm";

export type PaymentRow = ScheduledPayment;

export const columns: ColumnDef<PaymentRow>[] = [
  {
    accessorKey: "clientName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }: { row: Row<PaymentRow> }) => {
      const parts = row.original.clientName?.split(/\s+/) || [];
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";
      return (
        <Link
          href={`/dashboard/crm/clients/${row.original.clientId}`}
          className="flex items-center gap-2 decoration-primary/50 underline-offset-4 hover:underline"
        >
          <PersonAvatar photoUrl={row.original.clientPhotoUrl} firstName={firstName} lastName={lastName} size="sm" />
          <span className="font-medium text-black">{row.original.clientName}</span>
        </Link>
      );
    },
  },
  {
    accessorKey: "paymentAccountName",
    header: "Account",
    cell: ({ row }: { row: Row<PaymentRow> }) => (
      <div className="flex items-center gap-2">
        <CreditCard className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">{row.original.paymentAccountName}</span>
      </div>
    ),
  },
  {
    accessorKey: "carrierName",
    header: "Carrier",
    cell: ({ row }: { row: Row<PaymentRow> }) => (
      <div className="flex items-center gap-2">
        <Shield className="h-3 w-3 text-primary" />
        <span className="text-sm">{row.original.carrierName}</span>
      </div>
    ),
  },
  {
    accessorKey: "policyName",
    header: "Policy",
    cell: ({ row }: { row: Row<PaymentRow> }) => (
      <Link
        href={`/dashboard/crm/policies/${row.original.policyId}`}
        className="flex flex-col decoration-primary/50 underline-offset-4 hover:underline"
      >
        <span className="font-medium text-sm">{row.original.policyName}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{row.original.policyNumber}</span>
      </Link>
    ),
  },
  {
    accessorKey: "paymentAmount",
    header: "Amount Due",
    cell: ({ row }: { row: Row<PaymentRow> }) => (
      <div className="flex items-center font-bold text-green-700">
        <DollarSign className="h-3 w-3" />
        {row.original.paymentAmount.toLocaleString()}
        <Badge variant="outline" className="ml-2 h-3 origin-left scale-90 px-1 text-[8px] uppercase">
          {row.original.paymentSchedule}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "paymentDate",
    header: "Due Date",
    cell: ({ row }: { row: Row<PaymentRow> }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">{new Date(row.original.paymentDate).toLocaleDateString()}</span>
      </div>
    ),
  },
];
