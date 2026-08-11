"use no memo";
"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Pencil, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { deleteOpportunityPipeline } from "@/actions/opportunity-pipelines";
import { DataTable } from "@/components/features/data-table/data-table";
import { DataTablePagination } from "@/components/features/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { OpportunityPipeline } from "@/types/crm";

import { AumDialog } from "./aum-dialog";
import { columns, type EnrichedPipeline } from "./columns";
import { DeletePipelineAlert } from "./delete-pipeline-alert";

interface PipelinesTableProps {
  data: EnrichedPipeline[];
  defaultAumPerc: number;
}

export function PipelinesTable({ data, defaultAumPerc }: PipelinesTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState<OpportunityPipeline | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [isAumDialogOpen, setIsAumDialogOpen] = useState(false);

  const tableColumns = useMemo(() => columns(setPipelineToDelete), []);

  const handleDelete = async () => {
    if (!pipelineToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteOpportunityPipeline(pipelineToDelete.id);
      if (result.success) {
        toast.success("Opportunity Pipeline deleted successfully");
        setPipelineToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete pipeline");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

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
            <h1 className="font-bold text-3xl tracking-tight">Opportunity Pipelines</h1>
          </div>
          <div className="relative w-full max-w-xs sm:mt-2">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pipelines..."
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
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm shadow-xs">
            <span className="text-muted-foreground font-medium">Default AUM %:</span>
            <span className="font-semibold">{defaultAumPerc}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
              onClick={() => setIsAumDialogOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="sr-only">Edit Default AUM %</span>
            </Button>
          </div>
          <Button asChild className="shrink-0 font-semibold shadow-sm">
            <Link href="/dashboard/admin/opportunities/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Pipeline
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <DataTable table={table} columns={tableColumns} />
      </div>
      <DataTablePagination table={table} />

      <DeletePipelineAlert
        isOpen={!!pipelineToDelete}
        onClose={() => setPipelineToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        pipelineName={pipelineToDelete?.name || ""}
      />

      <AumDialog isOpen={isAumDialogOpen} onClose={() => setIsAumDialogOpen(false)} defaultValue={defaultAumPerc} />
    </div>
  );
}
