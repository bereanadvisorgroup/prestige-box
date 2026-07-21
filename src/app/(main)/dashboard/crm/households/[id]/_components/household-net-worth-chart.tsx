"use client";

import { useMemo, useState } from "react";
import type { HouseholdNetWorthOverviewData } from "@/lib/portfolio-rollup";

interface HouseholdNetWorthChartProps {
  data: HouseholdNetWorthOverviewData;
  householdName: string;
}

export function HouseholdNetWorthChart({ data, householdName }: HouseholdNetWorthChartProps) {
  const [_hoveredItem, setHoveredItem] = useState<{
    portfolioId: string;
    label: string;
    value: number;
    type: "asset" | "liability" | "networth";
  } | null>(null);

  const { portfolios, totalHouseholdAssets, totalHouseholdLiabilities, combinedNetWorth, asOfDate } = data;

  // Calculate maximum values for height scaling
  const maxPositive = useMemo(() => {
    let max = 0;
    for (const p of portfolios) {
      if (p.totalAssets > max) max = p.totalAssets;
      if (p.netWorth > max) max = p.netWorth;
    }
    return max > 0 ? max : 100000;
  }, [portfolios]);

  const maxNegative = useMemo(() => {
    let max = 0;
    for (const p of portfolios) {
      if (p.totalLiabilities > max) max = p.totalLiabilities;
    }
    return max > 0 ? max : 100000;
  }, [portfolios]);

  const POSITIVE_HEIGHT_PX = 240;
  const NEGATIVE_HEIGHT_PX = 130;

  // Color mappings
  const ASSET_COLORS: Record<string, string> = {
    retirement: "bg-[#2d5f47] text-white", // Dark Forest
    real_estate: "bg-[#437b60] text-white", // Medium Forest
    investments: "bg-[#629a7e] text-white", // Sage Forest
    cash_savings: "bg-[#86b89e] text-slate-900", // Mint
    other_assets: "bg-[#a8d4bd] text-slate-900", // Light Mint
  };

  const LIABILITY_COLORS: Record<string, string> = {
    mortgage: "bg-[#c04b36] text-white", // Terracotta
    student_loans: "bg-[#d86652] text-white", // Coral
    credit_cards: "bg-[#e58674] text-slate-900", // Light Coral
    other_liabilities: "bg-[#f1a798] text-slate-900", // Pale Coral
  };

  return (
    <div className="font-sans border-border bg-[#f8f9fa] text-foreground dark:border-border dark:bg-card w-full overflow-hidden rounded-xl border shadow-lg">
      {/* Top Header Title */}
      <div className="border-border/60 bg-muted/30 border-b py-5 text-center">
        <h2 className="font-semibold text-lg text-slate-800 uppercase tracking-widest sm:text-xl dark:text-slate-100">
          HOUSEHOLD NET WORTH: FINANCIAL OVERVIEW ({asOfDate})
        </h2>
        <p className="text-muted-foreground mt-1 font-medium text-xs uppercase tracking-wider">
          {householdName} Household Rollup
        </p>
      </div>

      {/* Main Graph Grid Container */}
      <div className="p-4 sm:p-6 lg:p-8 overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Top Portfolio Headers Block */}
          <div
            className="mb-6 grid gap-4 text-center"
            style={{
              gridTemplateColumns: `110px repeat(${portfolios.length}, minmax(0, 1fr))`,
            }}
          >
            {/* Empty corner for Y-Axis */}
            <div />

            {/* Column Headers */}
            {portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className="bg-background/80 border-border/40 space-y-1 rounded-lg border p-3 shadow-xs dark:bg-muted/20"
              >
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider dark:text-slate-100">
                  {portfolio.title}
                </h3>
                {portfolio.subtitle && (
                  <p className="text-muted-foreground truncate font-medium text-[11px]">{portfolio.subtitle}</p>
                )}
                <div className="text-slate-700 space-y-0.5 pt-2 text-xs font-medium dark:text-slate-300">
                  <div>
                    Assets:{" "}
                    <span className="text-emerald-700 font-bold dark:text-emerald-400">
                      ${portfolio.totalAssets.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    Liabilities:{" "}
                    <span className="text-rose-600 font-bold dark:text-rose-400">
                      ${portfolio.totalLiabilities.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-border/40 border-t pt-0.5">
                    Net Worth:{" "}
                    <span className="text-slate-900 font-extrabold dark:text-slate-100">
                      ${portfolio.netWorth.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Graph Section: Y-Axis + Columns */}
          <div
            className="relative grid items-stretch gap-4"
            style={{
              gridTemplateColumns: `110px repeat(${portfolios.length}, minmax(0, 1fr))`,
            }}
          >
            {/* Y-Axis Column */}
            <div className="text-muted-foreground relative flex flex-col justify-between pr-4 font-medium text-xs text-right select-none">
              <div style={{ height: `${POSITIVE_HEIGHT_PX}px` }} className="flex flex-col justify-between pb-2">
                <span>Assets</span>
                <span>Real Estate</span>
                <span>Investments</span>
                <span>Retirement</span>
              </div>
              <div className="text-slate-900 z-10 h-0 font-bold dark:text-slate-100">0</div>
              <div style={{ height: `${NEGATIVE_HEIGHT_PX}px` }} className="flex flex-col justify-between pt-2">
                <span>Liabilities</span>
                <span>Mortgages</span>
                <span>Loans</span>
              </div>
            </div>

            {/* Columns per Portfolio */}
            {portfolios.map((portfolio, idx) => {
              const isLast = idx === portfolios.length - 1;

              return (
                <div
                  key={portfolio.id}
                  className={`relative flex flex-col items-center px-4 ${!isLast ? "border-border/50 border-r" : ""}`}
                >
                  {/* Positive Section (Above $0 Axis) */}
                  <div
                    style={{ height: `${POSITIVE_HEIGHT_PX}px` }}
                    className="relative flex w-full items-end justify-center gap-3 pb-1 sm:gap-5"
                  >
                    {/* Left Bar: Stacked Assets */}
                    <div className="relative flex h-full w-14 flex-col-reverse items-center justify-start sm:w-16">
                      {/* Total Assets Top Label */}
                      <div className="text-emerald-800 mb-1 whitespace-nowrap text-center font-bold text-xs dark:text-emerald-400">
                        ${portfolio.totalAssets.toLocaleString()}
                      </div>

                      <div className="border-emerald-900/10 flex w-full flex-col-reverse overflow-hidden rounded-t border shadow-xs">
                        {portfolio.assetCategories.map((cat) => {
                          const heightPx = Math.max(4, (cat.totalValue / maxPositive) * POSITIVE_HEIGHT_PX);
                          const colorClass = ASSET_COLORS[cat.key] || ASSET_COLORS.other_assets;

                          return (
                            <button
                              type="button"
                              key={cat.key}
                              style={{ height: `${heightPx}px` }}
                              onMouseEnter={() =>
                                setHoveredItem({
                                  portfolioId: portfolio.id,
                                  label: cat.label,
                                  value: cat.totalValue,
                                  type: "asset",
                                })
                              }
                              onMouseLeave={() => setHoveredItem(null)}
                              className={`${colorClass} flex w-full flex-col items-center justify-center border-t border-white/20 px-1 text-[10px] font-medium leading-tight cursor-pointer overflow-hidden transition-all hover:brightness-110`}
                              title={`${cat.label}: $${cat.totalValue.toLocaleString()}`}
                              aria-label={`${cat.label}: $${cat.totalValue.toLocaleString()}`}
                            >
                              {heightPx > 28 && (
                                <div className="w-full px-0.5 text-center font-semibold truncate drop-shadow-xs">
                                  <span>{cat.label.split(" ")[0]}</span>
                                  <span className="block font-bold">${Math.round(cat.totalValue / 1000)}k</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Bar: Net Worth Bar */}
                    <div className="relative flex h-full w-14 flex-col items-center justify-end sm:w-16">
                      {/* Net Worth Top Label */}
                      <div className="text-slate-800 mb-1 whitespace-nowrap text-center font-bold text-xs dark:text-slate-200">
                        ${portfolio.netWorth.toLocaleString()}
                      </div>

                      {portfolio.netWorth > 0 && (
                        <button
                          type="button"
                          style={{
                            height: `${Math.max(4, (portfolio.netWorth / maxPositive) * POSITIVE_HEIGHT_PX)}px`,
                          }}
                          onMouseEnter={() =>
                            setHoveredItem({
                              portfolioId: portfolio.id,
                              label: "Net Worth",
                              value: portfolio.netWorth,
                              type: "networth",
                            })
                          }
                          onMouseLeave={() => setHoveredItem(null)}
                          className="w-full rounded-t bg-[#437b60] px-1 font-bold text-white text-[10px] cursor-pointer hover:bg-[#386a52] flex flex-col items-center justify-center overflow-hidden shadow-xs transition-colors"
                          title={`Net Worth: $${portfolio.netWorth.toLocaleString()}`}
                          aria-label={`Net Worth: $${portfolio.netWorth.toLocaleString()}`}
                        >
                          <div className="w-full px-0.5 text-center truncate">
                            <span>Net Worth:</span>
                            <span className="block font-extrabold">${portfolio.netWorth.toLocaleString()}</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Horizontal $0 Baseline Axis across column */}
                  <div className="bg-slate-400 dark:bg-slate-500 z-10 h-0.5 w-full" />

                  {/* Negative Section (Below $0 Axis) */}
                  <div
                    style={{ height: `${NEGATIVE_HEIGHT_PX}px` }}
                    className="relative flex w-full items-start justify-center gap-3 pt-1 sm:gap-5"
                  >
                    {/* Left Bar: Stacked Liabilities */}
                    <div className="flex h-full w-14 flex-col items-center justify-start sm:w-16">
                      <div className="border-rose-900/10 flex w-full flex-col overflow-hidden rounded-b border shadow-xs">
                        {portfolio.liabilityCategories.map((cat) => {
                          const heightPx = Math.max(4, (cat.totalValue / maxNegative) * NEGATIVE_HEIGHT_PX);
                          const colorClass = LIABILITY_COLORS[cat.key] || LIABILITY_COLORS.other_liabilities;

                          return (
                            <button
                              type="button"
                              key={cat.key}
                              style={{ height: `${heightPx}px` }}
                              onMouseEnter={() =>
                                setHoveredItem({
                                  portfolioId: portfolio.id,
                                  label: cat.label,
                                  value: cat.totalValue,
                                  type: "liability",
                                })
                              }
                              onMouseLeave={() => setHoveredItem(null)}
                              className={`${colorClass} flex w-full flex-col items-center justify-center border-b border-white/20 px-1 text-[10px] font-medium leading-tight cursor-pointer overflow-hidden transition-all hover:brightness-110`}
                              title={`${cat.label}: -$${cat.totalValue.toLocaleString()}`}
                              aria-label={`${cat.label}: -$${cat.totalValue.toLocaleString()}`}
                            >
                              {heightPx > 26 && (
                                <div className="w-full px-0.5 text-center font-semibold truncate">
                                  <span>{cat.label.split(" ")[0]}</span>
                                  <span className="block font-bold">-${Math.round(cat.totalValue / 1000)}k</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Bar: Total Liabilities Bar */}
                    <div className="flex h-full w-14 flex-col items-center justify-start sm:w-16">
                      {portfolio.totalLiabilities > 0 && (
                        <button
                          type="button"
                          style={{
                            height: `${Math.max(4, (portfolio.totalLiabilities / maxNegative) * NEGATIVE_HEIGHT_PX)}px`,
                          }}
                          onMouseEnter={() =>
                            setHoveredItem({
                              portfolioId: portfolio.id,
                              label: "Liabilities",
                              value: portfolio.totalLiabilities,
                              type: "liability",
                            })
                          }
                          onMouseLeave={() => setHoveredItem(null)}
                          className="w-full rounded-b bg-[#c04b36] px-1 font-bold text-white text-[10px] cursor-pointer hover:bg-[#aa3e2c] flex flex-col items-center justify-center overflow-hidden shadow-xs transition-colors"
                          title={`Liabilities: -$${portfolio.totalLiabilities.toLocaleString()}`}
                          aria-label={`Liabilities: -$${portfolio.totalLiabilities.toLocaleString()}`}
                        >
                          <div className="w-full px-0.5 text-center truncate">
                            <span>Liabilities:</span>
                            <span className="block font-extrabold">
                              -${portfolio.totalLiabilities.toLocaleString()}
                            </span>
                          </div>
                        </button>
                      )}
                      <div className="text-rose-700 mt-1 whitespace-nowrap text-center font-semibold text-[11px] dark:text-rose-400">
                        -${portfolio.totalLiabilities.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart Footer: Legend & Design Note */}
          <div className="border-border/50 text-muted-foreground mt-8 flex flex-col items-center justify-between gap-4 border-t pt-4 text-xs font-medium sm:flex-row">
            {/* Color Legend */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="rounded-xs bg-[#437b60] inline-block h-3.5 w-3.5 shadow-xs" />
                <span>Assets / Retireshold Assets</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-xs bg-[#c04b36] inline-block h-3.5 w-3.5 shadow-xs" />
                <span>Liabilities</span>
              </div>
            </div>

            {/* Design Note */}
            <div className="text-right italic text-[11px] opacity-80">
              * Focus on clarity, precision, and minimizing non-data ink <br />
              <span className="font-semibold not-italic">Modern digital screen display</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Summary Footer Banner */}
      <div className="border-border bg-[#e9ecef] text-slate-900 grid grid-cols-1 items-center gap-4 border-t px-6 py-4 text-center md:grid-cols-4 dark:bg-muted/60 dark:text-slate-100">
        <div className="text-slate-900 font-extrabold text-sm uppercase tracking-widest sm:text-base dark:text-slate-100">
          TOTAL HOUSEHOLD NET WORTH
        </div>

        <div>
          <span className="text-muted-foreground block font-semibold text-xs uppercase">Total Household Assets:</span>
          <span className="text-emerald-700 font-bold text-lg dark:text-emerald-400">
            ${totalHouseholdAssets.toLocaleString()}
          </span>
        </div>

        <div>
          <span className="text-muted-foreground block font-semibold text-xs uppercase">
            Total Household Liabilities:
          </span>
          <span className="text-rose-600 font-bold text-lg dark:text-rose-400">
            ${totalHouseholdLiabilities.toLocaleString()}
          </span>
        </div>

        <div>
          <span className="text-muted-foreground block font-semibold text-xs uppercase">COMBINED NET WORTH:</span>
          <span className="text-primary font-black text-xl">${combinedNetWorth.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
