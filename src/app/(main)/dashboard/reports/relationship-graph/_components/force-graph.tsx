"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import * as d3 from "d3";

import type { GraphLink, GraphNode } from "@/actions/relationship-graph";

import { GROUP_COLORS } from "./graph-legend";

// Extend d3 nodes/links with the simulation properties
interface SimulationNode extends GraphNode, d3.SimulationNodeDatum {
  radius?: number;
}
interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  label: string;
}

export interface ForceGraphRef {
  resetZoom: () => void;
}

interface ForceGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  visibleGroups: Record<string, boolean>;
  repulsionStrength: number;
  focusedNodeId: string | null;
}

export const ForceGraph = React.forwardRef<ForceGraphRef, ForceGraphProps>(
  ({ nodes, links, visibleGroups, repulsionStrength, focusedNodeId }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const svgRef = React.useRef<SVGSVGElement>(null);
    const router = useRouter();

    const [tooltip, setTooltip] = React.useState<{
      visible: boolean;
      x: number;
      y: number;
      name: string;
      type: string;
      connections: number;
    } | null>(null);

    // Filter data based on visibleGroups
    const filteredNodes = React.useMemo(() => {
      return nodes.filter((n) => visibleGroups[n.group] !== false);
    }, [nodes, visibleGroups]);

    const filteredLinks = React.useMemo(() => {
      const nodeIds = new Set(filteredNodes.map((n) => n.id));
      return links.filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target));
    }, [links, filteredNodes]);

    // Build adjacency list for focus mode
    const adjacencyList = React.useMemo(() => {
      const adj = new Map<string, Set<string>>();
      filteredNodes.forEach((n) => {
        adj.set(n.id, new Set());
      });
      filteredLinks.forEach((l) => {
        adj.get(l.source)?.add(l.target);
        adj.get(l.target)?.add(l.source);
      });
      return adj;
    }, [filteredNodes, filteredLinks]);

    // D3 variables
    const zoomRef = React.useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const simulationRef = React.useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);

    // Drag helper
    const drag = React.useCallback((simulation: d3.Simulation<SimulationNode, SimulationLink>) => {
      function dragstarted(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragended(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }, []);

    React.useImperativeHandle(ref, () => ({
      resetZoom: () => {
        if (svgRef.current && zoomRef.current) {
          const svg = d3.select(svgRef.current);
          svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
        }
      },
    }));

    // Initialize/Update Graph
    React.useEffect(() => {
      if (!containerRef.current || !svgRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight || 600;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove(); // Clear previous graph

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      zoomRef.current = zoom;
      svg.call(zoom);

      const g = svg.append("g");

      // Deep copy to avoid mutating the React state directly by d3
      const simNodes: SimulationNode[] = filteredNodes.map((d) => ({ ...d }));
      const simLinks: SimulationLink[] = filteredLinks.map((d) => ({ ...d }));

      // Calculate node radiuses
      simNodes.forEach((n) => {
        const connectionCount = adjacencyList.get(n.id)?.size || 0;
        n.radius = Math.max(6, Math.min(20, 6 + Math.sqrt(connectionCount) * 2));
      });

      const simulation = d3
        .forceSimulation<SimulationNode>(simNodes)
        .force(
          "link",
          d3
            .forceLink<SimulationNode, SimulationLink>(simLinks)
            .id((d) => d.id)
            .distance((d) => {
              // Same group closer together
              return (d.source as SimulationNode).group === (d.target as SimulationNode).group ? 50 : 100;
            }),
        )
        .force("charge", d3.forceManyBody().strength(-repulsionStrength))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force(
          "collide",
          d3.forceCollide().radius((d: any) => (d.radius || 6) + 2),
        );

      simulationRef.current = simulation;

      // Draw links
      const link = g
        .append("g")
        .attr("stroke", "var(--muted-foreground)")
        .attr("stroke-opacity", 0.3)
        .selectAll("line")
        .data(simLinks)
        .join("line")
        .attr("stroke-width", 1.5)
        .attr("class", "transition-opacity duration-300");

      // Draw nodes
      const node = g
        .append("g")
        .selectAll<SVGCircleElement, SimulationNode>("circle")
        .data(simNodes)
        .join("circle")
        .attr("r", (d) => d.radius || 6)
        .attr("fill", (d) => GROUP_COLORS[d.group] || "var(--muted)")
        .attr("stroke", "var(--background)")
        .attr("stroke-width", 1.5)
        .attr("class", "cursor-pointer transition-opacity duration-300 hover:stroke-foreground")
        .call(drag(simulation) as any)
        .on("mouseover", (event, d) => {
          const connectionCount = adjacencyList.get(d.id)?.size || 0;
          setTooltip({
            visible: true,
            x: event.pageX,
            y: event.pageY - 40,
            name: d.name,
            type: d.entityType,
            connections: connectionCount,
          });
          // Highlight hover connections
          if (!focusedNodeId) {
            const neighbors = adjacencyList.get(d.id);
            node.style("opacity", (n) => (n.id === d.id || neighbors?.has(n.id) ? 1 : 0.1));
            link.style("opacity", (l) =>
              (l.source as SimulationNode).id === d.id || (l.target as SimulationNode).id === d.id ? 0.8 : 0.05,
            );
          }
        })
        .on("mousemove", (event) => {
          setTooltip((prev) => (prev ? { ...prev, x: event.pageX, y: event.pageY - 40 } : null));
        })
        .on("mouseout", () => {
          setTooltip(null);
          // Reset highlights if not focused
          if (!focusedNodeId) {
            node.style("opacity", 1);
            link.style("opacity", 0.3);
          }
        })
        .on("click", (_event, d) => {
          if (d.url) {
            router.push(d.url);
          }
        });

      // Simulation ticks
      simulation.on("tick", () => {
        link
          .attr("x1", (d) => (d.source as SimulationNode).x!)
          .attr("y1", (d) => (d.source as SimulationNode).y!)
          .attr("x2", (d) => (d.target as SimulationNode).x!)
          .attr("y2", (d) => (d.target as SimulationNode).y!);

        node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
      });

      // Cleanup
      return () => {
        simulation.stop();
      };
    }, [filteredNodes, filteredLinks, repulsionStrength, adjacencyList, router, focusedNodeId, drag]); // Notice focusedNodeId is handled in a separate effect

    // Handle Focus Mode
    React.useEffect(() => {
      if (!svgRef.current || !simulationRef.current || !zoomRef.current) return;
      const svg = d3.select(svgRef.current);
      const node = svg.selectAll<SVGCircleElement, SimulationNode>("circle");
      const link = svg.selectAll<SVGLineElement, SimulationLink>("line");

      if (focusedNodeId) {
        const neighbors = adjacencyList.get(focusedNodeId) || new Set();
        node.style("opacity", (n) => (n.id === focusedNodeId || neighbors.has(n.id) ? 1 : 0.06));
        link.style("opacity", (l) =>
          (l.source as SimulationNode).id === focusedNodeId || (l.target as SimulationNode).id === focusedNodeId
            ? 0.8
            : 0.02,
        );

        // Auto-zoom to focused node
        const focusedNodeData = simulationRef.current.nodes().find((n) => n.id === focusedNodeId);
        if (focusedNodeData && focusedNodeData.x !== undefined && focusedNodeData.y !== undefined) {
          const width = containerRef.current?.clientWidth || 800;
          const height = containerRef.current?.clientHeight || 600;

          svg
            .transition()
            .duration(750)
            .call(
              zoomRef.current.transform,
              d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(2) // Zoom in
                .translate(-focusedNodeData.x, -focusedNodeData.y),
            );
        }
      } else {
        node.style("opacity", 1);
        link.style("opacity", 0.3);
      }
    }, [focusedNodeId, adjacencyList]);

    return (
      <div className="relative h-[700px] w-full" ref={containerRef}>
        <svg ref={svgRef} className="h-full w-full cursor-grab rounded-lg active:cursor-grabbing" />

        {/* Custom Tooltip */}
        {tooltip?.visible && (
          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 transform rounded-md border bg-popover px-3 py-2 text-popover-foreground text-sm shadow-md"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="font-semibold">{tooltip.name}</div>
            <div className="mt-1 flex items-center justify-between gap-4 text-muted-foreground text-xs">
              <span>{tooltip.type}</span>
              <span className="rounded bg-muted px-1 font-mono">{tooltip.connections} links</span>
            </div>
          </div>
        )}
      </div>
    );
  },
);

ForceGraph.displayName = "ForceGraph";
