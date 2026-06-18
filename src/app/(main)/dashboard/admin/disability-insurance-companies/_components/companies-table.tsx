"use no memo";
"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Plus, Search, X } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { DisabilityInsuranceCompany } from "@/types/crm";

import { columns } from "./columns";
import { DeleteCompanyAlert } from "./delete-company-alert";

interface CompaniesTableProps {
  data: DisabilityInsuranceCompany[];
}

export function CompaniesTable({ data }: CompaniesTableProps) {
  const [deleteCompany, setDeleteCompany] = useState<DisabilityInsuranceCompany | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const tableColumns = useMemo(() => columns(setDeleteCompany), []);

  const table = useDataTableInstance({
    data,
    columns: tableColumns,
    getRowId: (row) => row.id!,
    defaultSorting: [{ id: "name", desc: false }],
  });

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    table.getColumn("name")?.setFilterValue(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div>
            <h1 className="font-bold text-3xl text-primary tracking-tight">Disability Insurance Companies</h1>
            <p className="mt-1 text-sm text-muted-foreground">Configure carriers and the products they offer.</p>
          </div>
          <div className="relative w-full max-w-xs sm:mt-2">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name..."
              value={searchValue}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="bg-background pr-9 pl-9"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute top-2.5 right-3 flex h-4 w-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <Button asChild className="shrink-0 font-semibold shadow-sm">
          <Link href="/dashboard/admin/disability-insurance-companies/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <DataTable table={table} columns={tableColumns} />
      </div>
      <DataTablePagination table={table} />

      {deleteCompany && (
        <DeleteCompanyAlert
          company={deleteCompany}
          open={!!deleteCompany}
          onOpenChange={(open: boolean) => !open && setDeleteCompany(null)}
        />
      )}
    </div>
  );
}
