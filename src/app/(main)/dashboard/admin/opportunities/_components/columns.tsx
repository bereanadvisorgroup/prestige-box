"use client";

import Link from "next/link";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { ArrowUpRight, GitFork, Pencil, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OpportunityPipeline, OpportunityPipelineStage } from "@/types/crm";

export type EnrichedPipeline = OpportunityPipeline & {
  isLinked?: boolean;
};

export const columns = (onDelete: (pipeline: OpportunityPipeline) => void): ColumnDef<EnrichedPipeline>[] => [
  {
    accessorKey: "name",
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pipeline Name" />,
    cell: ({ row }: { row: Row<EnrichedPipeline> }) => {
      const pipeline = row.original;
      return (
        <div className="flex items-center gap-2">
          <GitFork className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/dashboard/admin/opportunities/${pipeline.id}/edit`}
            className="flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <span>{pipeline.name}</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "stages",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Stages" />,
    cell: ({ row }: { row: Row<EnrichedPipeline> }) => {
      const stages = (row.original.stages || []) as OpportunityPipelineStage[];
      if (stages.length === 0) return <span className="text-muted-foreground text-xs">No stages</span>;

      return (
        <div className="flex flex-wrap gap-1 max-w-sm">
          {stages.map((stage, idx) => (
            <Badge key={stage.id || idx} variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
              {stage.name}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }: { row: Row<EnrichedPipeline> }) => {
      const isActive = row.original.isActive;
      return (
        <Badge
          variant={isActive ? "outline" : "secondary"}
          className={isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300" : ""}
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }: { row: Row<EnrichedPipeline> }) => {
      const val = row.original.createdAt;
      if (!val) return "-";
      return <span className="text-sm">{new Date(val).toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<EnrichedPipeline> }) => {
      const pipeline = row.original;
      const isDeletable = !pipeline.isLinked;

      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/admin/opportunities/${pipeline.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {isDeletable ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => onDelete(pipeline)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-not-allowed text-muted-foreground/40"
              disabled
              title="Pipeline is in use by opportunities"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];
