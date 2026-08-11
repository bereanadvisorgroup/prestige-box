"use no memo";
"use client";

import * as React from "react";

import { Search } from "lucide-react";

import { DataTable } from "@/components/features/data-table/data-table";
import { DataTablePagination } from "@/components/features/data-table/data-table-pagination";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { ChangeHistoryWithEntity } from "@/types/crm";

import { getHistoryColumns } from "./history-columns";
import { HistoryDetailDialog } from "./history-detail-dialog";

interface HistoryTableProps {
  data: ChangeHistoryWithEntity[];
  /** Show the entity (record) column and cross-entity filters — used by the report view. */
  showEntity?: boolean;
}

export function HistoryTable({ data, showEntity = false }: HistoryTableProps) {
  const [search, setSearch] = React.useState("");
  const [entityType, setEntityType] = React.useState<string>("all");
  const [subType, setSubType] = React.useState<string>("all");
  const [selected, setSelected] = React.useState<ChangeHistoryWithEntity | null>(null);

  const subTypes = React.useMemo(() => Array.from(new Set(data.map((d) => d.subType))).sort(), [data]);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.filter((row) => {
      if (entityType !== "all" && row.entityType !== entityType) return false;
      if (subType !== "all" && row.subType !== subType) return false;
      if (!term) return true;
      return [row.entityName, row.subType, row.summary, row.fieldLabel, row.oldValue, row.newValue, row.actorName]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term));
    });
  }, [data, search, entityType, subType]);

  const columns = React.useMemo(() => getHistoryColumns(showEntity), [showEntity]);

  const table = useDataTableInstance({
    data: filtered,
    columns,
    enableRowSelection: false,
    getRowId: (row) => row.id as string,
    defaultPageSize: 15,
    defaultSorting: [{ id: "changedAt", desc: true }],
  });

  return (
    <div className="flex flex-col gap-4">
      {showEntity && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search history by record, category, field, value, or user…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="client">Clients</SelectItem>
              <SelectItem value="company">Companies</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subType} onValueChange={setSubType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {subTypes.map((st) => (
                <SelectItem key={st} value={st}>
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <DataTable table={table} columns={columns} onRowClick={setSelected} />
      </div>

      <DataTablePagination table={table} />

      <HistoryDetailDialog record={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
