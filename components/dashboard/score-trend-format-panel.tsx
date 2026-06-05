"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { cn } from "@/lib/utils";
import type { TrendPoint } from "@/lib/stats";

type TrendFormat = "18" | "9";

export function ScoreTrendFormatPanel({
  eighteenHoleTrend,
  nineHoleTrend,
  handicap,
  initialFormat = "18",
  actions,
}: {
  eighteenHoleTrend: TrendPoint[];
  nineHoleTrend: TrendPoint[];
  handicap: number | null;
  initialFormat?: TrendFormat;
  actions?: React.ReactNode;
}) {
  const [format, setFormat] = React.useState<TrendFormat>(initialFormat);
  const trend = format === "18" ? eighteenHoleTrend : nineHoleTrend;
  const label = format === "18" ? "18-hole" : "9-hole";

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> Score trend
          </div>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">
            Last {trend.length} {label} round{trend.length === 1 ? "" : "s"}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-muted p-1">
            <TrendFormatButton
              active={format === "18"}
              label="18H"
              onClick={() => setFormat("18")}
            />
            <TrendFormatButton
              active={format === "9"}
              label="9H"
              onClick={() => setFormat("9")}
            />
          </div>
          {actions}
        </div>
      </div>
      <TrendChart
        trend={trend}
        handicap={handicap}
        emptyMessage={`No ${label} rounds yet.`}
      />
    </>
  );
}

function TrendFormatButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-10 min-w-12 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        active
          ? "bg-background text-foreground shadow-sm dark:bg-input/30"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
