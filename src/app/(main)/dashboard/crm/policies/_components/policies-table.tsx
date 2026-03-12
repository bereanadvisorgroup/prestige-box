"use client";

import { useState } from "react";

import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { ClientPolicy } from "@/types/crm";

import { columns } from "./columns";
import { DeletePolicyAlert } from "./delete-policy-alert";

interface PoliciesTableProps {
  data: ClientPolicy[];
}

export function PoliciesTable({ data }: PoliciesTableProps) {
  const [deletePolicy, setDeletePolicy] = useState<ClientPolicy | null>(null);

  const table = useDataTableInstance({
    data,
    columns: columns(setDeletePolicy),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setDeletePolicy)} />
      {deletePolicy && (
        <DeletePolicyAlert
          policy={deletePolicy}
          open={!!deletePolicy}
          onOpenChange={(open: boolean) => !open && setDeletePolicy(null)}
        />
      )}
    </>
  );
}
