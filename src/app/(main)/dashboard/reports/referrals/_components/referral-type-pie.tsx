"use client";

import * as React from "react";

import { Label, Pie, PieChart } from "recharts";

import type { ReferralTypeDatum } from "@/actions/referrals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

interface ReferralTypePieProps {
  data: ReferralTypeDatum[];
}

export function ReferralTypePie({ data }: ReferralTypePieProps) {
  const chartData = React.useMemo(() => data.map((d, i) => ({ ...d, fill: PALETTE[i % PALETTE.length] })), [data]);
  const total = React.useMemo(() => data.reduce((acc, d) => acc + d.count, 0), [data]);
  const chartConfig = React.useMemo(
    () =>
      chartData.reduce((acc, d) => {
        acc[d.name] = { label: d.name, color: d.fill };
        return acc;
      }, {} as ChartConfig),
    [chartData],
  );

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Referral Types</CardTitle>
        <CardDescription>Clients sourced from the referral-type list</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground text-sm">No referral-type sourced clients yet.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-64 min-h-56 w-full max-w-64">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="name" />} />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={2}
                  cornerRadius={4}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground font-bold text-3xl tabular-nums"
                            >
                              {total.toLocaleString()}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 24} className="fill-muted-foreground">
                              Clients
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            <ul className="flex w-full flex-col gap-2.5 lg:max-w-56">
              {chartData.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: item.fill }} />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {item.count}
                    <span className="ml-1 text-xs">({total ? Math.round((item.count / total) * 100) : 0}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
