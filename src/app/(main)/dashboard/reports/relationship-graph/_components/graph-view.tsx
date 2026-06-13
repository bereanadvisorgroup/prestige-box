"use client";

import * as React from "react";

import type { GraphLink, GraphNode } from "@/actions/relationship-graph";
import { Card } from "@/components/ui/card";

import { EntityFocusSearch } from "./entity-focus-search";
import { ForceGraph, type ForceGraphRef } from "./force-graph";
import { GraphControls } from "./graph-controls";
import { GROUP_COLORS, GraphLegend } from "./graph-legend";

interface GraphViewProps {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function GraphView({ nodes, links }: GraphViewProps) {
  const forceGraphRef = React.useRef<ForceGraphRef>(null);
  const [focusedNodeId, setFocusedNodeId] = React.useState<string | null>(null);

  // Default visible groups (Addresses hidden by default to reduce noise)
  const initialVisibleGroups = Object.keys(GROUP_COLORS).reduce(
    (acc, group) => {
      acc[group] = group !== "Address";
      return acc;
    },
    {} as Record<string, boolean>,
  );

  const [visibleGroups, setVisibleGroups] = React.useState<Record<string, boolean>>(initialVisibleGroups);
  const [repulsionStrength, setRepulsionStrength] = React.useState(300);

  const handleGroupToggle = (group: string, visible: boolean) => {
    setVisibleGroups((prev) => ({ ...prev, [group]: visible }));
  };

  const handleResetZoom = () => {
    forceGraphRef.current?.resetZoom();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="relative z-20 w-full">
        <EntityFocusSearch nodes={nodes} focusedNodeId={focusedNodeId} onNodeFocus={setFocusedNodeId} />
      </div>

      <div className="relative flex flex-col gap-6 xl:flex-row">
        <Card className="relative z-10 flex-1 overflow-hidden border shadow-sm">
          <ForceGraph
            ref={forceGraphRef}
            nodes={nodes}
            links={links}
            visibleGroups={visibleGroups}
            repulsionStrength={repulsionStrength}
            focusedNodeId={focusedNodeId}
          />
        </Card>

        <div className="z-10 w-full shrink-0 xl:w-72">
          <GraphControls
            groups={Object.keys(GROUP_COLORS)}
            visibleGroups={visibleGroups}
            onGroupToggle={handleGroupToggle}
            repulsionStrength={repulsionStrength}
            onRepulsionChange={setRepulsionStrength}
            onResetZoom={handleResetZoom}
          />
        </div>
      </div>

      <GraphLegend groups={Object.keys(GROUP_COLORS)} />
    </div>
  );
}
