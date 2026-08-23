"use no memo";
"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowRightLeft, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { deleteTaskCategory } from "@/actions/task-categories";
import { DataTable } from "@/components/features/data-table/data-table";
import { DataTablePagination } from "@/components/features/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { TaskCategoryWithCount } from "@/types/crm";

import { BulkReassignDialog } from "./bulk-reassign-dialog";
import { columns } from "./columns";
import { DeleteTaskCategoryDialog } from "./delete-task-category-dialog";

interface TaskCategoriesTableProps {
  data: TaskCategoryWithCount[];
}

export function TaskCategoriesTable({ data }: TaskCategoriesTableProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<TaskCategoryWithCount | null>(null);
  const [isBulkReassignOpen, setIsBulkReassignOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const tableColumns = useMemo(() => columns(setCategoryToDelete), []);

  const handleDelete = async (reassignToCategoryName?: string) => {
    if (!categoryToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteTaskCategory(categoryToDelete.id, reassignToCategoryName);
      if (result.success) {
        if (result.reassignedCount && result.reassignedCount > 0) {
          toast.success(
            `Category deleted and ${result.reassignedCount} task(s) reassigned to "${reassignToCategoryName}".`,
          );
        } else {
          toast.success("Task category deleted successfully");
        }
        setCategoryToDelete(null);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete task category");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred while deleting the category.");
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
            <h1 className="font-bold text-3xl tracking-tight">Task Categories</h1>
            <p className="text-muted-foreground text-sm">Manage categories and bulk reassign tasks.</p>
          </div>
          <div className="relative w-full max-w-xs sm:mt-2">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
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
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {data.length >= 2 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBulkReassignOpen(true)}
              className="font-semibold shadow-sm gap-1.5"
            >
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              Bulk Reassign
            </Button>
          )}
          <Button asChild className="shrink-0 font-semibold shadow-sm">
            <Link href="/dashboard/admin/task-categories/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <DataTable table={table} columns={tableColumns} />
      </div>
      <DataTablePagination table={table} />

      <DeleteTaskCategoryDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        category={categoryToDelete}
        allCategories={data}
      />

      <BulkReassignDialog
        isOpen={isBulkReassignOpen}
        onClose={() => setIsBulkReassignOpen(false)}
        categories={data}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
