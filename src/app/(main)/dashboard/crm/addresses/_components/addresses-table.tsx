"use no memo";
"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Plus, Search, X } from "lucide-react";

import { DeleteAddressAlert } from "@/app/(main)/dashboard/crm/addresses/_components/delete-address-alert";
import { DataTable } from "@/components/features/data-table/data-table";
import { DataTablePagination } from "@/components/features/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { Address } from "@/types/crm";

import { columns, type EnrichedAddress } from "./columns";

interface AddressesTableProps {
  data: EnrichedAddress[];
}

export function AddressesTable({ data }: AddressesTableProps) {
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [localData, setLocalData] = useState<EnrichedAddress[]>(data);
  const [tableKey, setTableKey] = useState(0);
  const [searchValue, setSearchValue] = useState("");

  // Keep in sync when server data changes (e.g. navigation)
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const tableColumns = useMemo(() => columns(setAddressToDelete), []);

  const table = useDataTableInstance({
    data: localData,
    columns: tableColumns,
    getRowId: (row) => row.id!,
    defaultSorting: [{ id: "street1", desc: false }],
  });

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    table.getColumn("street1")?.setFilterValue(value);
  };

  const handleDeleted = (id: string) => {
    setLocalData((prev) => prev.filter((item) => item.id !== id));
    setAddressToDelete(null);
    setTableKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">Addresses</h1>
          </div>
          <div className="relative w-full max-w-xs sm:mt-2">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by street..."
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
          <Link href="/dashboard/crm/addresses/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Address
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <DataTable key={tableKey} table={table} columns={tableColumns} />
      </div>
      <DataTablePagination table={table} />
      {addressToDelete && (
        <DeleteAddressAlert
          address={addressToDelete}
          open={!!addressToDelete}
          onOpenChange={(open: boolean) => {
            if (!open) setAddressToDelete(null);
          }}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
