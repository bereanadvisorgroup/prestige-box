"use client";

import { useState } from "react";

import type { ScheduledPayment } from "@/actions/payments";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { columns } from "./columns";

interface PaymentsTableProps {
  data: ScheduledPayment[];
}

export function PaymentsTable({ data }: PaymentsTableProps) {
  const table = useDataTableInstance({
    data,
    columns,
    getRowId: (row) => `${row.policyId}-${row.paymentDate}`,
  });

  return <DataTable table={table} columns={columns} />;
}
