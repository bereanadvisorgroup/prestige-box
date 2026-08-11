"use no memo";
"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { deletePropertyAndCasualtyFirm } from "@/actions/property-and-casualty";
import { DataTable } from "@/components/features/data-table/data-table";
import { DataTablePagination } from "@/components/features/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { PropertyAndCasualtyFirm } from "@/types/crm";

import { columns } from "./columns";
import { DeletePropertyAndCasualtyAlert } from "./delete-property-and-casualty-alert";

interface PropertyAndCasualtyTableProps {
  data: PropertyAndCasualtyFirm[];
}

export function PropertyAndCasualtyTable({ data }: PropertyAndCasualtyTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [firmToDelete, setFirmToDelete] = useState<PropertyAndCasualtyFirm | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const tableColumns = useMemo(() => columns(setFirmToDelete), []);

  const handleDelete = async () => {
    if (!firmToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deletePropertyAndCasualtyFirm(firmToDelete.id);
      if (result.success) {
        toast.success("Property And Casualty Firm deleted successfully");
        setFirmToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete Property And Casualty Firm");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const table = useDataTableInstance({
    data,
    columns: tableColumns,
    getRowId: (row) => row.id!,
    defaultSorting: [{ id: "firmName", desc: false }],
  });

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    table.getColumn("firmName")?.setFilterValue(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">Property And Casualty</h1>
          </div>
          <div className="relative w-full max-w-xs sm:mt-2">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by firm name..."
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
          <Link href="/dashboard/crm/property-and-casualty/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Firm
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <DataTable table={table} columns={tableColumns} />
      </div>
      <DataTablePagination table={table} />

      <DeletePropertyAndCasualtyAlert
        isOpen={!!firmToDelete}
        onClose={() => setFirmToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        firmName={firmToDelete?.firmName || ""}
      />
    </div>
  );
}
