"use no memo";
"use client";

import { DataTable } from "@/components/features/data-table/data-table";
import { DataTablePagination } from "@/components/features/data-table/data-table-pagination";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { TaskWithRelations } from "@/types/crm";

import { taskColumns } from "./task-columns";

interface TaskListProps {
  data: TaskWithRelations[];
  onRowClick?: (task: TaskWithRelations) => void;
}

export function TaskList({ data, onRowClick }: TaskListProps) {
  const table = useDataTableInstance({
    data,
    columns: taskColumns,
    enableRowSelection: false,
    getRowId: (row) => row.id as string,
    defaultPageSize: 15,
    defaultSorting: [{ id: "dueDate", desc: false }],
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border">
        <DataTable table={table} columns={taskColumns} onRowClick={onRowClick} />
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
