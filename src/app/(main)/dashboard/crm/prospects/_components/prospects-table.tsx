"use client";

import * as React from "react";

import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Download, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { batchDeleteProspects, batchUpdateProspectStage } from "@/actions/prospects";
import { DataTablePagination } from "@/components/features/data-table/data-table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  type Campaign,
  type EnrichedProspect,
  PROSPECT_SOURCES,
  PROSPECT_STAGES,
  type ProspectStage,
} from "@/types/prospects";

import { columns } from "./columns";

interface ProspectsTableProps {
  data: EnrichedProspect[];
  campaigns?: Campaign[];
  onEdit: (prospect: EnrichedProspect) => void;
  onConvert: (prospect: EnrichedProspect) => void;
  onDelete: (prospect: EnrichedProspect) => void;
}

export function ProspectsTable({ data, campaigns = [], onEdit, onConvert, onDelete }: ProspectsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "score", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Filters state
  const [stageFilter, setStageFilter] = React.useState<string>("all");
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all"); // all, prospect, client
  const [campaignFilter, setCampaignFilter] = React.useState<string>("all");

  // Batch action processing state
  const [isBatchProcessing, setIsBatchProcessing] = React.useState(false);

  // Filter pipeline
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      // 1. Stage filter
      if (stageFilter !== "all" && item.stage !== stageFilter) {
        return false;
      }

      // 2. Source filter
      if (sourceFilter !== "all" && (item.source || "Direct") !== sourceFilter) {
        return false;
      }

      // 3. Status filter
      if (statusFilter === "client" && !item.convertedClientId) {
        return false;
      }
      if (statusFilter === "prospect" && item.convertedClientId) {
        return false;
      }

      // 4. Campaign filter
      if (campaignFilter !== "all") {
        if (campaignFilter === "none" && item.primaryCampaignId) {
          return false;
        }
        if (campaignFilter !== "none" && item.primaryCampaignId !== campaignFilter) {
          return false;
        }
      }

      // 4. Global search filter
      if (globalFilter.trim()) {
        const query = globalFilter.toLowerCase().trim();
        const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
        const email = (item.email || "").toLowerCase();
        const phone = (item.phone || "").toLowerCase();
        const company = (item.company || "").toLowerCase();
        const jobTitle = (item.jobTitle || "").toLowerCase();
        const campaign = (item.primaryCampaignName || "").toLowerCase();

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          company.includes(query) ||
          jobTitle.includes(query) ||
          campaign.includes(query)
        );
      }

      return true;
    });
  }, [data, stageFilter, sourceFilter, statusFilter, campaignFilter, globalFilter]);

  const tableColumns = React.useMemo(() => columns(onEdit, onConvert, onDelete), [onEdit, onConvert, onDelete]);

  const table = useReactTable({
    data: filteredData,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((r) => r.original.id!).filter(Boolean);

  // Batch Update Stage
  const handleBatchStage = async (newStage: ProspectStage) => {
    if (selectedIds.length === 0) return;
    setIsBatchProcessing(true);
    try {
      const res = await batchUpdateProspectStage(selectedIds, newStage);
      if (res.success) {
        toast.success(`Updated ${selectedIds.length} prospects to stage "${newStage}".`);
        setRowSelection({});
      } else {
        toast.error(res.error || "Failed to update selected prospects.");
      }
    } catch {
      toast.error("Failed to update selected prospects.");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirm = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} selected prospect(s)? Converted clients will be preserved.`,
    );
    if (!confirm) return;

    setIsBatchProcessing(true);
    try {
      const res = await batchDeleteProspects(selectedIds);
      if (res.success) {
        toast.success(`Deleted ${res.deletedCount} prospects.`);
        setRowSelection({});
      } else {
        toast.error(res.error || "Failed to delete selected prospects.");
      }
    } catch {
      toast.error("Failed to delete selected prospects.");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const exportTargets = selectedRows.length > 0 ? selectedRows.map((r) => r.original) : filteredData;

    if (exportTargets.length === 0) {
      toast.info("No prospects to export.");
      return;
    }

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Company",
      "Job Title",
      "Stage",
      "Score",
      "Source",
      "Primary Campaign",
      "Assigned Rep",
      "Client Converted",
      "Created At",
    ];

    const csvRows = exportTargets.map((p) => [
      `"${p.firstName || ""}"`,
      `"${p.lastName || ""}"`,
      `"${p.email || ""}"`,
      `"${p.phone || ""}"`,
      `"${p.company || ""}"`,
      `"${p.jobTitle || ""}"`,
      `"${p.stage || ""}"`,
      p.score ?? 0,
      `"${p.source || "Direct"}"`,
      `"${p.primaryCampaignName || ""}"`,
      `"${p.assignedRepName || ""}"`,
      p.convertedClientId ? "Yes" : "No",
      `"${p.createdAt || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `prospects-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${exportTargets.length} prospects to CSV.`);
  };

  const hasActiveFilters =
    stageFilter !== "all" ||
    sourceFilter !== "all" ||
    statusFilter !== "all" ||
    campaignFilter !== "all" ||
    globalFilter.trim() !== "";

  const clearFilters = () => {
    setStageFilter("all");
    setSourceFilter("all");
    setStatusFilter("all");
    setCampaignFilter("all");
    setGlobalFilter("");
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Global Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prospects, email, company..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>

          {/* Stage filter */}
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[130px] text-xs">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {PROSPECT_STAGES.map((st) => (
                <SelectItem key={st} value={st}>
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Source filter */}
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[130px] text-xs">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {PROSPECT_SOURCES.map((src) => (
                <SelectItem key={src} value={src}>
                  {src}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Campaign filter */}
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-[150px] text-xs">
              <SelectValue placeholder="Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="none">Direct / No Campaign</SelectItem>
              {campaigns.map((camp) => (
                <SelectItem key={camp.id} value={camp.id!}>
                  {camp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Converted status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prospects</SelectItem>
              <SelectItem value="prospect">Unconverted Only</SelectItem>
              <SelectItem value="client">Converted Clients</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>

        {/* Right side: Batch action & Export */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 p-1">
              <Badge variant="secondary" className="font-mono text-xs">
                {selectedIds.length} selected
              </Badge>

              {/* Batch stage selector */}
              <Select onValueChange={(val) => handleBatchStage(val as ProspectStage)} disabled={isBatchProcessing}>
                <SelectTrigger className="h-7 w-[120px] text-xs">
                  <SelectValue placeholder="Move to..." />
                </SelectTrigger>
                <SelectContent>
                  {PROSPECT_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Batch delete */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={handleBatchDelete}
                disabled={isBatchProcessing}
                title="Delete selected"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={handleExportCsv} className="h-8 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            <span>{selectedIds.length > 0 ? "Export Selected" : "Export CSV"}</span>
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-md border bg-card shadow-xs">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="transition-colors hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-28 text-center">
                  <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
                    <p className="font-medium text-sm">No prospects found.</p>
                    <p className="text-xs">
                      {hasActiveFilters
                        ? "Try adjusting your filters or search keywords."
                        : "Create a prospect or import a CSV file to get started."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  );
}
