"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, Calendar, Pencil, Shield, Trash2 } from "lucide-react";

import { PersonAvatar } from "@/components/features/crm/person-avatar";
import { DataTableColumnHeader } from "@/components/features/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { ClientPolicy } from "@/types/crm";

export type EnrichedPolicy = ClientPolicy & {
  clientName?: string;
  clientPhotoUrl?: string | null;
  carrierName?: string;
};

export const columns = (onDelete: (policy: ClientPolicy) => void): ColumnDef<EnrichedPolicy>[] => [
  {
    accessorKey: "clientName",
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }: { row: Row<EnrichedPolicy> }) => {
      const parts = row.original.clientName?.split(/\s+/) || [];
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";
      return (
        <div className="flex items-center gap-2">
          <PersonAvatar photoUrl={row.original.clientPhotoUrl} firstName={firstName} lastName={lastName} size="sm" />
          <div className="flex flex-col">
            <Link
              href={`/dashboard/crm/policies/${row.original.id}`}
              className="flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              <span>{row.original.clientName}</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
            </Link>
            <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Policy Client</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "carrierName",
    header: "Carrier",
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue || filterValue === "all") return true;
      return row.getValue(columnId) === filterValue;
    },
    cell: ({ row }: { row: Row<EnrichedPolicy> }) => (
      <div className="flex items-center gap-2">
        <Shield className="h-3 w-3 text-primary" />
        <span className="font-medium text-sm">{row.original.carrierName}</span>
      </div>
    ),
  },
  {
    accessorKey: "policyName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Policy Details" />,
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      const search = (filterValue as string).toLowerCase();
      const name = (row.original.policyName || "").toLowerCase();
      const num = (row.original.policyNumber || "").toLowerCase();
      return name.includes(search) || num.includes(search);
    },
    cell: ({ row }: { row: Row<ClientPolicy> }) => (
      <div className="flex flex-col">
        <Link href={`/dashboard/crm/policies/${row.original.id}`} className="hover:underline">
          <span className="font-bold text-foreground text-sm">{row.original.policyName}</span>
        </Link>
        <span className="font-mono text-[10px] text-muted-foreground">{row.original.policyNumber}</span>
      </div>
    ),
  },
  {
    accessorKey: "isUnderManagement",
    header: "Under Management",
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue || filterValue === "all") return true;
      const val = row.getValue(columnId);
      if (filterValue === "yes") return val === true;
      if (filterValue === "no") return val === false;
      return true;
    },
    cell: ({ row }: { row: Row<EnrichedPolicy> }) => {
      const isManaged = row.original.isUnderManagement;
      return isManaged ? (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px]">
          Managed
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground text-[10px]">
          Unmanaged
        </Badge>
      );
    },
  },
  {
    accessorKey: "premiumAmount",
    header: "Premium",
    cell: ({ row }: { row: Row<ClientPolicy> }) => (
      <div className="flex flex-col">
        <span className="font-bold text-green-700">{formatCurrency(row.original.premiumAmount)}</span>
        <Badge variant="outline" className="h-3 w-fit origin-left scale-90 py-0 text-[8px] uppercase">
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
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Calendar className="h-3 w-3" />
            {renewal.toLocaleDateString()}
          </div>
          {isPast ? (
            <Badge variant="destructive" className="h-3 w-fit py-0 text-[8px] shadow-none">
              {row.original.lifeInsuranceCompanyId ? "ANNIVERSARY PASSED" : "EXPIRED"}
            </Badge>
          ) : isSoon ? (
            <Badge variant="secondary" className="h-3 w-fit bg-amber-100 py-0 text-[8px] text-amber-700 shadow-none">
              {row.original.lifeInsuranceCompanyId ? "ANNIVERSARY SOON" : "RENEWAL SOON"}
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
        <div className="flex items-center justify-end gap-2">
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
