"use client";

import { useState } from "react";

import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { Household } from "@/types/crm";

import { columns } from "./columns";
import { DeleteHouseholdAlert } from "./delete-household-alert";

interface HouseholdsTableProps {
  data: Household[];
}

export function HouseholdsTable({ data }: HouseholdsTableProps) {
  const [deleteHousehold, setDeleteHousehold] = useState<Household | null>(null);

  const table = useDataTableInstance({
    data,
    columns: columns(setDeleteHousehold),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setDeleteHousehold)} />
      {deleteHousehold && (
        <DeleteHouseholdAlert
          household={deleteHousehold}
          open={!!deleteHousehold}
          onOpenChange={(open: boolean) => !open && setDeleteHousehold(null)}
        />
      )}
    </>
  );
}
