"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { ReferralTimePoint } from "@/actions/referrals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
  referred: {
    label: "Clients Referred",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface ReferralsOverTimeProps {
  data: ReferralTimePoint[];
}

export function ReferralsOverTime({ data }: ReferralsOverTimeProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Referrals Over Time</CardTitle>
        <CardDescription>New referred clients per month, last 12 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} minTickGap={16} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} width={28} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <defs>
              <linearGradient id="fill-referred" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-referred)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-referred)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              dataKey="referred"
              type="monotone"
              fill="url(#fill-referred)"
              stroke="var(--color-referred)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
