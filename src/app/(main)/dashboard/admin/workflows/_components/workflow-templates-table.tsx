"use no memo";
"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { deleteWorkflowTemplate } from "@/actions/workflow-templates";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { WorkflowTemplateListItem } from "@/types/workflows";

import { columns } from "./columns";
import { DeleteTemplateAlert } from "./delete-template-alert";
import { StartWorkflowDialog } from "./start-workflow-dialog";

interface WorkflowTemplatesTableProps {
  data: WorkflowTemplateListItem[];
}

export function WorkflowTemplatesTable({ data }: WorkflowTemplatesTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<WorkflowTemplateListItem | null>(null);
  const [templateToStart, setTemplateToStart] = useState<WorkflowTemplateListItem | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const tableColumns = useMemo(() => columns(setTemplateToStart, setTemplateToDelete), []);

  const handleDelete = async () => {
    if (!templateToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteWorkflowTemplate(templateToDelete.id);
      if (result.success) {
        toast.success("Workflow deleted successfully");
        setTemplateToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete workflow");
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
    getRowId: (row) => row.id,
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
            <h1 className="font-bold text-3xl tracking-tight">Workflows</h1>
          </div>
          <div className="relative w-full max-w-xs sm:mt-2">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
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
          <Link href="/dashboard/admin/workflows/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Workflow
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <DataTable table={table} columns={tableColumns} />
      </div>
      <DataTablePagination table={table} />

      <DeleteTemplateAlert
        isOpen={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        templateName={templateToDelete?.name || ""}
      />

      <StartWorkflowDialog
        isOpen={!!templateToStart}
        onClose={() => setTemplateToStart(null)}
        templateId={templateToStart?.id ?? null}
        templateName={templateToStart?.name || ""}
      />
    </div>
  );
}
