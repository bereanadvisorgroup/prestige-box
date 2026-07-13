"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, Pencil, Play, Trash2, Workflow } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkflowTemplateListItem } from "@/types/workflows";

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const columns = (
  onStart: (template: WorkflowTemplateListItem) => void,
  onDelete: (template: WorkflowTemplateListItem) => void,
): ColumnDef<WorkflowTemplateListItem>[] => [
  {
    accessorKey: "name",
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Workflow Name" />,
    cell: ({ row }: { row: Row<WorkflowTemplateListItem> }) => {
      const template = row.original;
      return (
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/dashboard/admin/workflows/${template.id}/edit`}
            className="flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <span>{template.name}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }: { row: Row<WorkflowTemplateListItem> }) => {
      const text = stripHtml(row.original.description);
      if (!text) return <span className="text-muted-foreground">-</span>;
      return <span className="line-clamp-1 max-w-md text-muted-foreground text-sm">{text}</span>;
    },
  },
  {
    accessorKey: "stepCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Steps" />,
    cell: ({ row }: { row: Row<WorkflowTemplateListItem> }) => (
      <Badge variant="secondary">{row.original.stepCount}</Badge>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
    cell: ({ row }: { row: Row<WorkflowTemplateListItem> }) => {
      const val = row.original.updatedAt;
      if (!val) return "-";
      return <span className="text-sm">{new Date(val).toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<WorkflowTemplateListItem> }) => {
      const template = row.original;
      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            title="Start workflow for a client or company"
            onClick={() => onStart(template)}
          >
            <Play className="h-4 w-4" />
          </Button>
          <Link href={`/dashboard/admin/workflows/${template.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {template.isLinked ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/40 cursor-not-allowed"
              title="Cannot delete template: it has active workflow instances"
              disabled
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => onDelete(template)}
              title="Delete workflow template"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];
