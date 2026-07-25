"use client";

import * as React from "react";
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  Clock,
  DollarSign,
  HelpCircle,
  Layers,
  Percent,
  PieChart,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface PipelineSummarySectionProps {
  opportunities: any[];
  pipelines: any[];
  targetDateHistory?: any[];
}

export function PipelineSummarySection({
  opportunities,
  pipelines,
  targetDateHistory = [],
}: PipelineSummarySectionProps) {
  // Filter active (open) opportunities across all pipelines
  const activeOpportunities = React.useMemo(() => {
    return opportunities.filter((o) => !o.resultStatus);
  }, [opportunities]);

  // Set of open opportunity IDs for quick filtering of history records
  const openOppIds = React.useMemo(() => {
    return new Set(activeOpportunities.map((o) => o.id));
  }, [activeOpportunities]);

  // Target Date Change Analytics for Open Opportunities
  const targetDateMetrics = React.useMemo(() => {
    const openOppHistory = targetDateHistory.filter(
      (h) => openOppIds.has(h.opportunityId) && h.type === "target_close_date_change",
    );

    let totalDaysShift = 0;
    let positiveShifts = 0;
    let negativeShifts = 0;
    let validCount = 0;
    const oppsWithChanges = new Set<string>();

    for (const h of openOppHistory) {
      if (h.opportunityId) oppsWithChanges.add(h.opportunityId);

      if (h.oldValue && h.newValue) {
        const d1 = new Date(h.oldValue).getTime();
        const d2 = new Date(h.newValue).getTime();

        if (!isNaN(d1) && !isNaN(d2)) {
          const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
          totalDaysShift += diffDays;
          validCount++;
          if (diffDays > 0) positiveShifts++;
          if (diffDays < 0) negativeShifts++;
        }
      }
    }

    const avgLength = validCount > 0 ? (totalDaysShift / validCount).toFixed(1) : "0";
    const totalChangesCount = openOppHistory.length;
    const oppsWithChangesCount = oppsWithChanges.size;
    const oppsSlippagePercent =
      activeOpportunities.length > 0 ? Math.round((oppsWithChangesCount / activeOpportunities.length) * 100) : 0;

    return {
      totalChangesCount,
      avgLength,
      validCount,
      oppsWithChangesCount,
      oppsSlippagePercent,
      positiveShifts,
      negativeShifts,
    };
  }, [targetDateHistory, openOppIds, activeOpportunities]);

  // Overall totals across all pipelines
  const overallActiveAmount = React.useMemo(() => {
    return activeOpportunities.reduce((sum, o) => sum + Number.parseFloat(o.amount || "0"), 0);
  }, [activeOpportunities]);

  const overallProbWinAmount = React.useMemo(() => {
    return activeOpportunities.reduce(
      (sum, o) => sum + Number.parseFloat(o.amount || "0") * ((o.probabilityWin || 0) / 100),
      0,
    );
  }, [activeOpportunities]);

  const overallAvgWinPercentage = React.useMemo(() => {
    if (activeOpportunities.length === 0) return 0;
    const sumProb = activeOpportunities.reduce((sum, o) => sum + (o.probabilityWin || 0), 0);
    return Math.round(sumProb / activeOpportunities.length);
  }, [activeOpportunities]);

  // Pipeline breakdown computations
  const pipelineRows = React.useMemo(() => {
    return pipelines.map((pipeline, index) => {
      const pipelineOpps = activeOpportunities.filter((o) => o.pipelineId === pipeline.id);
      const dealCount = pipelineOpps.length;
      const totalAmount = pipelineOpps.reduce((sum, o) => sum + Number.parseFloat(o.amount || "0"), 0);

      const contributionPercent =
        overallActiveAmount > 0 ? ((totalAmount / overallActiveAmount) * 100).toFixed(1) : "0.0";

      const probWinAmount = pipelineOpps.reduce(
        (sum, o) => sum + Number.parseFloat(o.amount || "0") * ((o.probabilityWin || 0) / 100),
        0,
      );

      const avgWinPercent =
        dealCount > 0 ? Math.round(pipelineOpps.reduce((sum, o) => sum + (o.probabilityWin || 0), 0) / dealCount) : 0;

      // Color accents for pipelines
      const colors = [
        "bg-blue-500 text-blue-500 border-blue-500/20 bg-blue-500/10",
        "bg-emerald-500 text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
        "bg-violet-500 text-violet-500 border-violet-500/20 bg-violet-500/10",
        "bg-amber-500 text-amber-500 border-amber-500/20 bg-amber-500/10",
        "bg-rose-500 text-rose-500 border-rose-500/20 bg-rose-500/10",
        "bg-cyan-500 text-cyan-500 border-cyan-500/20 bg-cyan-500/10",
      ];
      const colorStyle = colors[index % colors.length];

      return {
        id: pipeline.id,
        name: pipeline.name,
        dealCount,
        totalAmount,
        contributionPercent: Number.parseFloat(contributionPercent),
        probWinAmount,
        avgWinPercent,
        colorStyle,
      };
    });
  }, [pipelines, activeOpportunities, overallActiveAmount]);

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

  return (
    <div className="space-y-6 pt-6 border-t">
      {/* Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Sales Pipeline Performance & Overview
          </h2>
          <p className="text-xs text-muted-foreground">
            Aggregated summary across all pipelines, contribution share, target date stability, and probable win values.
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-xs font-semibold px-3 py-1 bg-card shadow-xs">
          {activeOpportunities.length} Active Deals Across {pipelines.length} Pipelines
        </Badge>
      </div>

      {/* Target Date Analytics KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border bg-gradient-to-br from-card to-muted/20 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <CalendarClock className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Target Date Changes
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold tracking-tight">{targetDateMetrics.totalChangesCount}</span>
                <span className="text-xs text-muted-foreground">
                  ({targetDateMetrics.oppsWithChangesCount} open deals)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-gradient-to-br from-card to-muted/20 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Clock className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Avg. Date Shift Length
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold tracking-tight">
                  {Number.parseFloat(targetDateMetrics.avgLength) > 0
                    ? `+${targetDateMetrics.avgLength}`
                    : targetDateMetrics.avgLength}{" "}
                  days
                </span>
                <span className="text-xs text-muted-foreground">per adjustment</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-gradient-to-br from-card to-muted/20 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Target Date Stability
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold tracking-tight">
                  {100 - targetDateMetrics.oppsSlippagePercent}%
                </span>
                <span className="text-xs text-muted-foreground">on-schedule deals</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabular Pipeline Summary */}
      <Card className="border shadow-xs overflow-hidden">
        <CardHeader className="py-4 px-6 bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" /> Pipeline Contribution & Probability Matrix
              </CardTitle>
              <CardDescription className="text-xs">
                Detailed breakdown of active opportunity volume, contribution share, and win probabilities by pipeline.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-xs uppercase tracking-wider">Pipeline</TableHead>
                <TableHead className="text-center font-bold text-xs uppercase tracking-wider">Open Deals</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wider">
                  Total Active Amount
                </TableHead>
                <TableHead className="w-[200px] font-bold text-xs uppercase tracking-wider">
                  Pipeline Contribution %
                </TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wider">
                  Weighted Probable Win ($)
                </TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wider">
                  Avg. Win Probability
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pipelineRows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-semibold text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", row.colorStyle.split(" ")[0])} />
                      <span className="truncate max-w-[200px]">{row.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">{row.dealCount}</TableCell>
                  <TableCell className="text-right font-bold tracking-tight">
                    {currencyFormatter.format(row.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{row.contributionPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            row.colorStyle.split(" ")[0],
                          )}
                          style={{ width: `${Math.min(100, Math.max(0, row.contributionPercent))}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-blue-600 dark:text-blue-400">
                    {currencyFormatter.format(row.probWinAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="font-semibold text-xs px-2 py-0.5">
                      {row.avgWinPercent}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}

              {/* Total Summary Row */}
              <TableRow className="bg-muted/40 font-bold border-t-2">
                <TableCell className="text-sm font-extrabold uppercase tracking-wider">Total Summary</TableCell>
                <TableCell className="text-center text-sm font-extrabold">{activeOpportunities.length}</TableCell>
                <TableCell className="text-right text-base font-extrabold text-primary">
                  {currencyFormatter.format(overallActiveAmount)}
                </TableCell>
                <TableCell className="text-xs font-extrabold">
                  <div className="flex items-center gap-2">
                    <span>100.0%</span>
                    <div className="h-1.5 flex-1 rounded-full bg-primary" />
                  </div>
                </TableCell>
                <TableCell className="text-right text-base font-extrabold text-blue-600 dark:text-blue-400">
                  {currencyFormatter.format(overallProbWinAmount)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge className="font-extrabold text-xs px-2.5 py-0.5 bg-primary text-primary-foreground">
                    {overallAvgWinPercentage}%
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
