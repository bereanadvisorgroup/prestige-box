"use no memo";
"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Filter, Plus, Search, X } from "lucide-react";

import { DataTable } from "@/components/features/data-table/data-table";
import { DataTablePagination } from "@/components/features/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { ClientPolicy } from "@/types/crm";

import { columns, type EnrichedPolicy } from "./columns";
import { DeletePolicyAlert } from "./delete-policy-alert";

interface PoliciesTableProps {
  data: ClientPolicy[];
}

export function PoliciesTable({ data }: PoliciesTableProps) {
  const [deletePolicy, setDeletePolicy] = useState<ClientPolicy | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState("all");
  const [policyDetailsSearch, setPolicyDetailsSearch] = useState("");
  const [selectedManagementStatus, setSelectedManagementStatus] = useState("all");

  const carriers = useMemo(() => {
    const list = data
      .map((p) => (p as EnrichedPolicy).carrierName)
      .filter((name): name is string => Boolean(name) && name !== "Unknown Carrier");
    return Array.from(new Set(list)).sort();
  }, [data]);

  const tableColumns = useMemo(() => columns(setDeletePolicy), []);

  const table = useDataTableInstance({
    data,
    columns: tableColumns,
    getRowId: (row) => row.id!,
    defaultSorting: [{ id: "clientName", desc: false }],
  });

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    table.getColumn("clientName")?.setFilterValue(value);
  };

  const handleCarrierChange = (value: string) => {
    setSelectedCarrier(value);
    table.getColumn("carrierName")?.setFilterValue(value === "all" ? undefined : value);
  };

  const handlePolicyDetailsChange = (value: string) => {
    setPolicyDetailsSearch(value);
    table.getColumn("policyName")?.setFilterValue(value || undefined);
  };

  const handleManagementStatusChange = (value: string) => {
    setSelectedManagementStatus(value);
    table.getColumn("isUnderManagement")?.setFilterValue(value === "all" ? undefined : value);
  };

  const hasActiveFilters =
    selectedCarrier !== "all" || policyDetailsSearch !== "" || selectedManagementStatus !== "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">Client Policies</h1>
          </div>
          <div className="relative w-full max-w-xs sm:mt-2">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client name..."
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
          <Link href="/dashboard/crm/policies/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Policy
          </Link>
        </Button>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>

        {/* Carrier Filter */}
        <div className="w-full sm:w-48">
          <Select value={selectedCarrier} onValueChange={handleCarrierChange}>
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue placeholder="Carrier: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              {carriers.map((carrier) => (
                <SelectItem key={carrier} value={carrier}>
                  {carrier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Policy Details Filter */}
        <div className="relative w-full sm:w-56">
          <Input
            placeholder="Filter by policy name or #..."
            value={policyDetailsSearch}
            onChange={(e) => handlePolicyDetailsChange(e.target.value)}
            className="h-9 pr-8 text-xs bg-background"
          />
          {policyDetailsSearch && (
            <button
              type="button"
              onClick={() => handlePolicyDetailsChange("")}
              className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Under our Management Filter */}
        <div className="w-full sm:w-48">
          <Select value={selectedManagementStatus} onValueChange={handleManagementStatusChange}>
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue placeholder="Management: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Management</SelectItem>
              <SelectItem value="yes">Under Management</SelectItem>
              <SelectItem value="no">Unmanaged</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleCarrierChange("all");
              handlePolicyDetailsChange("");
              handleManagementStatusChange("all");
            }}
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset Filters
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <DataTable table={table} columns={tableColumns} />
      </div>
      <DataTablePagination table={table} />
      {deletePolicy && (
        <DeletePolicyAlert
          policy={deletePolicy}
          open={!!deletePolicy}
          onOpenChange={(open: boolean) => !open && setDeletePolicy(null)}
        />
      )}
    </div>
  );
}
