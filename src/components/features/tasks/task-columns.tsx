"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { format } from "date-fns";

import { DataTableColumnHeader } from "@/components/features/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import type { TaskPriority, TaskStatus, TaskWithRelations } from "@/types/crm";

import { getCategoryStyle, PRIORITY_STYLES, STATUS_STYLES } from "./task-meta";

function DueDate({ row }: { row: Row<TaskWithRelations> }) {
  const raw = row.original.dueDate;
  if (!raw) return <span className="text-muted-foreground text-sm">—</span>;
  const d = new Date(raw);
  const isOverdue = row.original.status !== "Complete" && d.getTime() < Date.now();
  return (
    <span className={`text-sm ${isOverdue ? "font-medium text-rose-600" : ""}`}>
      {format(d, "MMM d, yyyy")}
      {isOverdue && " (overdue)"}
    </span>
  );
}

export const taskColumns: ColumnDef<TaskWithRelations>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant="outline" className={STATUS_STYLES[row.original.status as TaskStatus]}>
        {row.original.status}
      </Badge>
    ),
    filterFn: (row, _id, value: string) => value === "all" || row.original.status === value,
  },
  {
    accessorKey: "priority",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
    cell: ({ row }) => (
      <Badge variant="outline" className={PRIORITY_STYLES[row.original.priority as TaskPriority]}>
        {row.original.priority}
      </Badge>
    ),
    filterFn: (row, _id, value: string) => value === "all" || row.original.priority === value,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="outline" className={getCategoryStyle(row.original.category)}>
        {row.original.category}
      </Badge>
    ),
    filterFn: (row, _id, value: string) => value === "all" || row.original.category === value,
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
    cell: ({ row }) => <DueDate row={row} />,
  },
  {
    id: "completeDate",
    header: "Completed",
    cell: ({ row }) =>
      row.original.completeDate ? (
        <span className="text-muted-foreground text-sm">
          {format(new Date(row.original.completeDate), "MMM d, yyyy")}
        </span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  },
  {
    id: "assignees",
    header: "Assignees",
    cell: ({ row }) => {
      const names = row.original.assignees.map((a) => a.name);
      if (names.length === 0) return <span className="text-muted-foreground text-sm">Unassigned</span>;
      return (
        <span className="text-sm">
          {names.slice(0, 2).join(", ")}
          {names.length > 2 && ` +${names.length - 2}`}
        </span>
      );
    },
  },
  {
    id: "associations",
    header: "Associations",
    cell: ({ row }) => {
      const names = row.original.associations.map((a) => a.name);
      if (names.length === 0) return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <span className="text-sm">
          {names.slice(0, 2).join(", ")}
          {names.length > 2 && ` +${names.length - 2}`}
        </span>
      );
    },
  },
];
