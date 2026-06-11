"use client";

import { useState } from "react";

import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { LongTermCareInsurance } from "@/types/crm";

import { columns } from "./columns";
import { DeleteInsuranceAlert } from "./delete-insurance-alert";

interface InsuranceTableProps {
  data: LongTermCareInsurance[];
}

export function InsuranceTable({ data }: InsuranceTableProps) {
  const [deleteCompany, setDeleteCompany] = useState<LongTermCareInsurance | null>(null);

  const table = useDataTableInstance({
    data,
    columns: columns(setDeleteCompany),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setDeleteCompany)} />
      {deleteCompany && (
        <DeleteInsuranceAlert
          company={deleteCompany}
          open={!!deleteCompany}
          onOpenChange={(open: boolean) => !open && setDeleteCompany(null)}
        />
      )}
    </>
  );
}
