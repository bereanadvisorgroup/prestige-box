"use client";

import { Badge } from "@/components/ui/badge";

export const GROUP_COLORS: Record<string, string> = {
  Client: "var(--chart-1)",
  Person: "var(--chart-2)",
  Household: "var(--chart-3)",
  "Professional Service": "var(--chart-4)",
  Vendor: "var(--chart-5)",
  Company: "var(--accent)",
  Address: "var(--muted-foreground)",
};

interface GraphLegendProps {
  groups: string[];
}

export function GraphLegend({ groups }: GraphLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground mr-2">Legend:</span>
      {groups.map((group) => (
        <Badge key={group} variant="outline" className="flex items-center gap-1.5 px-2 py-0.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: GROUP_COLORS[group] || "var(--muted)" }}
          />
          {group}
        </Badge>
      ))}
    </div>
  );
}
