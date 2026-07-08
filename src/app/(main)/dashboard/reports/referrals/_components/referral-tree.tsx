"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import * as d3 from "d3";
import { RotateCcw } from "lucide-react";

import type { ReferralNodeType, ReferralTreeLink, ReferralTreeNode } from "@/actions/referrals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const NODE_COLORS: Record<ReferralNodeType, string> = {
  Client: "var(--chart-1)",
  Company: "var(--chart-2)",
  Person: "var(--chart-3)",
  Advisor: "var(--chart-4)",
};

interface SimulationNode extends ReferralTreeNode, d3.SimulationNodeDatum {
  radius?: number;
}
interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {}

interface ReferralTreeProps {
  nodes: ReferralTreeNode[];
  links: ReferralTreeLink[];
}

export function ReferralTree({ nodes, links }: ReferralTreeProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const zoomRef = React.useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const router = useRouter();

  const [tooltip, setTooltip] = React.useState<{
    x: number;
    y: number;
    name: string;
    type: string;
    referrals: number;
  } | null>(null);

  // Count how many clients each node referred (out-degree) for sizing.
  const outDegree = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of links) {
      counts.set(l.source, (counts.get(l.source) || 0) + 1);
    }
    return counts;
  }, [links]);

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

  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  React.useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Arrowhead marker (referrer -> referred direction)
    svg
      .append("defs")
      .append("marker")
      .attr("id", "referral-arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "var(--muted-foreground)");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    zoomRef.current = zoom;
    svg.call(zoom);

    const g = svg.append("g");

    const simNodes: SimulationNode[] = nodes.map((d) => ({ ...d }));
    const simLinks: SimulationLink[] = links.map((d) => ({ ...d }));

    simNodes.forEach((n) => {
      const referrals = outDegree.get(n.id) || 0;
      n.radius = Math.max(7, Math.min(22, 7 + Math.sqrt(referrals) * 3));
    });

    const simulation = d3
      .forceSimulation<SimulationNode>(simNodes)
      .force(
        "link",
        d3
          .forceLink<SimulationNode, SimulationLink>(simLinks)
          .id((d) => d.id)
          .distance(90),
      )
      .force("charge", d3.forceManyBody().strength(-320))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide().radius((d: any) => (d.radius || 7) + 4),
      );

    const link = g
      .append("g")
      .attr("stroke", "var(--muted-foreground)")
      .attr("stroke-opacity", 0.35)
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#referral-arrow)")
      .attr("class", "transition-opacity duration-300");

    const nodeGroup = g.append("g").selectAll<SVGGElement, SimulationNode>("g").data(simNodes).join("g");

    nodeGroup
      .append("circle")
      .attr("r", (d) => d.radius || 7)
      .attr("fill", (d) => NODE_COLORS[d.type] || "var(--muted)")
      .attr("stroke", "var(--background)")
      .attr("stroke-width", 1.5)
      .attr("class", "cursor-pointer transition-opacity duration-300 hover:stroke-foreground")
      .call(drag(simulation) as any)
      .on("mouseover", (event, d) => {
        setTooltip({
          x: event.pageX,
          y: event.pageY - 40,
          name: d.name,
          type: d.type,
          referrals: outDegree.get(d.id) || 0,
        });
      })
      .on("mousemove", (event) => {
        setTooltip((prev) => (prev ? { ...prev, x: event.pageX, y: event.pageY - 40 } : null));
      })
      .on("mouseout", () => setTooltip(null))
      .on("click", (_event, d) => {
        if (d.url) router.push(d.url);
      });

    // Labels for referrers (nodes that referred at least one client) to keep the graph readable.
    nodeGroup
      .append("text")
      .filter((d) => (outDegree.get(d.id) || 0) > 0)
      .text((d) => d.name)
      .attr("x", (d) => (d.radius || 7) + 4)
      .attr("y", 4)
      .attr("class", "pointer-events-none fill-foreground text-[10px]")
      .attr("stroke", "var(--background)")
      .attr("stroke-width", 3)
      .attr("paint-order", "stroke");

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimulationNode).x!)
        .attr("y1", (d) => (d.source as SimulationNode).y!)
        .attr("x2", (d) => (d.target as SimulationNode).x!)
        .attr("y2", (d) => (d.target as SimulationNode).y!);
      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, outDegree, drag, router]);

  if (nodes.length === 0) {
    return (
      <Card className="flex h-[500px] items-center justify-center border shadow-sm">
        <p className="text-muted-foreground text-sm">
          No client-to-client, company, or person referrals to display yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="relative overflow-hidden border shadow-sm">
        <div className="absolute top-3 right-3 z-10">
          <Button variant="outline" size="sm" onClick={handleResetZoom} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
        <div className="relative h-[600px] w-full" ref={containerRef}>
          <svg ref={svgRef} className="h-full w-full cursor-grab rounded-lg active:cursor-grabbing" />
          {tooltip && (
            <div
              className="pointer-events-none fixed z-50 -translate-x-1/2 transform rounded-md border bg-popover px-3 py-2 text-popover-foreground text-sm shadow-md"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              <div className="font-semibold">{tooltip.name}</div>
              <div className="mt-1 flex items-center justify-between gap-4 text-muted-foreground text-xs">
                <span>{tooltip.type}</span>
                <span className="rounded bg-muted px-1 font-mono">{tooltip.referrals} referred</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 font-medium text-muted-foreground text-sm">Legend:</span>
        {(Object.keys(NODE_COLORS) as ReferralNodeType[]).map((type) => (
          <Badge key={type} variant="outline" className="flex items-center gap-1.5 px-2 py-0.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: NODE_COLORS[type] }} />
            {type}
          </Badge>
        ))}
        <span className="ml-2 text-muted-foreground text-xs">Arrows point from referrer → referred client.</span>
      </div>
    </div>
  );
}
