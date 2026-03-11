"use client";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { UserProfile } from "@/stores/auth.store";

import { columns } from "./columns";

interface UsersTableProps {
  data: UserProfile[];
}

export function UsersTable({ data }: UsersTableProps) {
  const table = useDataTableInstance({
    data,
    columns,
    getRowId: (row) => row.uid,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <DataTable table={table} columns={columns} />
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
