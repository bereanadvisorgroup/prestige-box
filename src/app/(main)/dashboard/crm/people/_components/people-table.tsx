"use no memo";
"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Plus, Search, X } from "lucide-react";

import { DataTable } from "@/components/features/data-table/data-table";
import { DataTablePagination } from "@/components/features/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { Person } from "@/types/crm";

import { columns } from "./columns";
import { DeletePersonAlert } from "./delete-person-alert";

interface PeopleTableProps {
  data: Person[];
}

export function PeopleTable({ data }: PeopleTableProps) {
  const [deletePerson, setDeletePerson] = useState<Person | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [selectedRelation, setSelectedRelation] = useState("all");

  const tableColumns = useMemo(() => columns(setDeletePerson), []);

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

  const handleRelationFilterChange = (value: string) => {
    setSelectedRelation(value);
    if (value === "all") {
      table.getColumn("relations")?.setFilterValue(undefined);
    } else {
      table.getColumn("relations")?.setFilterValue(value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex w-full max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">People</h1>
          </div>
          <div className="relative w-full max-w-xs sm:mt-2">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
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
          <div className="w-full max-w-[200px] sm:mt-2">
            <Select value={selectedRelation} onValueChange={handleRelationFilterChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Relations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Relations</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="family">Client Family</SelectItem>
                <SelectItem value="company">Company Owner</SelectItem>
                <SelectItem value="firm">Firms & Banks</SelectItem>
                <SelectItem value="household">Households</SelectItem>
                <SelectItem value="manager">Money Managers & Keepers</SelectItem>
                <SelectItem value="insurance">Insurance Vendors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button asChild className="shrink-0 font-semibold shadow-sm">
          <Link href="/dashboard/crm/people/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Person
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <DataTable table={table} columns={tableColumns} />
      </div>
      <DataTablePagination table={table} />
      {deletePerson && (
        <DeletePersonAlert
          person={deletePerson}
          open={!!deletePerson}
          onOpenChange={(open: boolean) => !open && setDeletePerson(null)}
        />
      )}
    </div>
  );
}
