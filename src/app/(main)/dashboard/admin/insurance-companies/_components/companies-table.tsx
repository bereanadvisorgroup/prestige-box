"use client";

import { useState } from "react";

import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { InsuranceCompany } from "@/types/crm";

import { columns } from "./columns";
import { DeleteCompanyAlert } from "./delete-company-alert";

interface CompaniesTableProps {
  data: InsuranceCompany[];
}

export function CompaniesTable({ data }: CompaniesTableProps) {
  const [deleteCompany, setDeleteCompany] = useState<InsuranceCompany | null>(null);

  const table = useDataTableInstance({
    data,
    columns: columns(setDeleteCompany),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setDeleteCompany)} />
      {deleteCompany && (
        <DeleteCompanyAlert
          company={deleteCompany}
          open={!!deleteCompany}
          onOpenChange={(open: boolean) => !open && setDeleteCompany(null)}
        />
      )}
    </>
  );
}
