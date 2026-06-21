"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface NetWorthGraphProps {
  historyData: Record<string, string | number>[];
}

const chartConfig = {
  total: {
    label: "Net Worth Trend",
    color: "var(--chart-1)",
  },
};

export function NetWorthGraph({ historyData }: NetWorthGraphProps) {
  if (!historyData || historyData.length === 0) {
    return (
      <Card className="border-none bg-linear-to-b from-card to-muted/20 shadow-md">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <TrendingUp className="mb-4 h-12 w-12 opacity-25" />
          <p className="text-sm">Historical net worth graphing will display here once you add asset value snapshots.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-linear-to-b from-card to-muted/20 shadow-md">
      <CardHeader className="border-b bg-muted/10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-4 w-4 text-primary" /> Net Worth Trend
        </CardTitle>
        <CardDescription>Historical valuation timeline of physical asset equity.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer className="max-h-72 w-full" config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => {
                  const d = new Date(value);
                  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                  return `$${value}`;
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Total Value"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
