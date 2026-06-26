"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Calendar, Loader2, Plus, Trash2, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import {
  addCompanyValuationSnapshot,
  deleteCompanyValuationSnapshot,
  getCompanyValuationHistory,
} from "@/actions/companies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { CompanyValuationHistory } from "@/types/crm";

interface ValuationHistoryProps {
  companyId: string;
  initialHistory: CompanyValuationHistory[];
}

const chartConfig = {
  value: {
    label: "Company Value Trend",
    color: "var(--chart-1)",
  },
};

export function ValuationHistory({ companyId, initialHistory }: ValuationHistoryProps) {
  const router = useRouter();
  const [history, setHistory] = useState<CompanyValuationHistory[]>(initialHistory);
  const [newValue, setNewValue] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [, startTransition] = useTransition();

  const handleRefresh = async () => {
    const res = await getCompanyValuationHistory(companyId);
    if (res.success && res.history) {
      setHistory(res.history);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue || Number.isNaN(parseFloat(newValue))) {
      toast.error("Please enter a valid valuation amount");
      return;
    }

    try {
      setIsLoading(true);
      const val = parseFloat(newValue);
      const res = await addCompanyValuationSnapshot(
        companyId,
        val,
        newDate ? new Date(newDate).toISOString() : undefined,
      );

      if (res.success) {
        toast.success("Valuation snapshot added successfully");
        setNewValue("");
        await handleRefresh();
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(res.error || "Failed to add valuation snapshot");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this valuation snapshot?")) return;

    try {
      setIsLoading(true);
      const res = await deleteCompanyValuationSnapshot(id);
      if (res.success) {
        toast.success("Valuation snapshot deleted successfully");
        await handleRefresh();
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(res.error || "Failed to delete valuation snapshot");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Format chart data
  const chartData = history.map((item) => ({
    date: item.valuationDate ? new Date(item.valuationDate).toISOString().split("T")[0] : "",
    value: Number(item.value) || 0,
  }));

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Chart Section */}
      <Card className="border-none bg-linear-to-b from-card to-muted/20 shadow-md lg:col-span-2">
        <CardHeader className="border-b bg-muted/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" /> Estimated Value Trend
          </CardTitle>
          <CardDescription>Historical valuation timeline of this company.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {chartData.length > 0 ? (
            <ChartContainer className="max-h-72 w-full" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
                      if (!value) return "";
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
                          if (!value) return "";
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
                    dataKey="value"
                    name="Estimated Value"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex h-52 flex-col items-center justify-center text-center text-muted-foreground">
              <TrendingUp className="mb-2 h-10 w-10 opacity-20" />
              <p className="text-sm">No historical estimated values logged yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Valuation Form & History List */}
      <div className="space-y-6">
        {/* Form */}
        <Card className="border-none shadow-md">
          <CardHeader className="bg-muted/10 pb-4">
            <CardTitle className="text-lg">Log Estimated Value</CardTitle>
            <CardDescription>Enter a new valuation snapshot with date.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="value-input"
                  className="font-semibold text-muted-foreground text-xs uppercase tracking-wider"
                >
                  Value Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">$</span>
                  <Input
                    id="value-input"
                    type="number"
                    step="0.01"
                    placeholder="1,000,000.00"
                    className="pl-7 font-medium"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="date-input"
                  className="font-semibold text-muted-foreground text-xs uppercase tracking-wider"
                >
                  Valuation Date
                </label>
                <Input
                  id="date-input"
                  type="date"
                  className="font-medium"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full font-bold">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Valuation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History List */}
        <Card className="border-none shadow-md">
          <CardHeader className="bg-muted/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-4 w-4 text-primary" /> History List
            </CardTitle>
            <CardDescription>All recorded estimated values.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {history.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...history].reverse().map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.valuationDate
                            ? new Date(item.valuationDate).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(item.value) || 0)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(item.id!)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground text-sm italic">No entries logged.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
