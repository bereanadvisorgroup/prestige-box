"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, ListFilter, Pencil, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/features/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TaskCategoryWithCount } from "@/types/crm";

export const columns = (onDelete: (category: TaskCategoryWithCount) => void): ColumnDef<TaskCategoryWithCount>[] => [
  {
    accessorKey: "name",
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category Name" />,
    cell: ({ row }: { row: Row<TaskCategoryWithCount> }) => {
      const category = row.original;
      return (
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/dashboard/admin/task-categories/${category.id}`}
            className="flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <span>{category.name}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "taskCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tasks Assigned" />,
    cell: ({ row }: { row: Row<TaskCategoryWithCount> }) => {
      const count = row.original.taskCount ?? 0;
      return (
        <Badge
          variant="outline"
          className={
            count > 0
              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
              : "bg-muted text-muted-foreground"
          }
        >
          {count} {count === 1 ? "task" : "tasks"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }: { row: Row<TaskCategoryWithCount> }) => {
      const val = row.original.createdAt;
      if (!val) return "-";
      return <span className="text-sm text-muted-foreground">{new Date(val).toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
    cell: ({ row }: { row: Row<TaskCategoryWithCount> }) => {
      const val = row.original.updatedAt;
      if (!val) return "-";
      return <span className="text-sm text-muted-foreground">{new Date(val).toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<TaskCategoryWithCount> }) => {
      const category = row.original;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/admin/task-categories/${category.id}/edit`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              title="Edit category"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive/80"
            onClick={() => onDelete(category)}
            title="Delete category"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
