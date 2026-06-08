"use client";

import { ChevronsLeftRight } from "lucide-react";
import type { HoleHeatmapCell } from "@/lib/stats";

function colorFor(avgVsPar: number): string {
  if (avgVsPar <= -0.5) return "oklch(0.72 0.17 152 / 0.9)";
  if (avgVsPar <= 0) return "oklch(0.72 0.17 152 / 0.55)";
  if (avgVsPar <= 0.5) return "oklch(0.72 0.17 152 / 0.25)";
  if (avgVsPar <= 1) return "oklch(0.78 0.14 80 / 0.35)";
  if (avgVsPar <= 1.5) return "oklch(0.78 0.14 80 / 0.55)";
  if (avgVsPar <= 2) return "oklch(0.7 0.18 30 / 0.4)";
  return "oklch(0.7 0.18 30 / 0.7)";
}

export function HoleHeatmap({ cells }: { cells: HoleHeatmapCell[] }) {
  if (cells.length === 0) {
    return (
      <div className="grid h-48 place-items-center text-sm text-muted-foreground">
        No hole data yet.
      </div>
    );
  }
  const sorted = [...cells].sort((a, b) => a.holeNumber - b.holeNumber);
  const renderRow = (row: typeof sorted, label: string) => (
    <div>
      <div className="mb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="relative -mx-1">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-card via-card/80 to-transparent sm:hidden" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 translate-x-1 place-items-center rounded-full border border-border/70 bg-background/85 text-muted-foreground shadow-sm backdrop-blur-sm sm:hidden"
        >
          <ChevronsLeftRight className="h-4 w-4" />
        </div>
        <div className="overflow-x-auto px-1 pr-12 [scrollbar-width:thin] sm:pr-1">
          <div className="grid min-w-[540px] grid-cols-9 gap-1.5">
            {row.map((c) => (
            <div
              key={c.holeNumber}
              className="rounded-lg border border-border/60 p-2"
              style={{ background: colorFor(c.avgVsPar) }}
            >
              <div className="flex items-baseline justify-between text-[10px] text-muted-foreground">
                <span className="font-semibold text-foreground">H{c.holeNumber}</span>
                <span>p{c.par}</span>
              </div>
              <div className="number-mono mt-1 text-base font-semibold">
                {c.avgStrokes.toFixed(2)}
              </div>
              <div className="text-[10px]">
                {c.avgVsPar >= 0 ? "+" : ""}
                {c.avgVsPar.toFixed(2)}
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="space-y-4">
      {renderRow(sorted.slice(0, 9), "Front 9")}
      {sorted.length > 9 && renderRow(sorted.slice(9, 18), "Back 9")}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-block h-3 w-3 rounded" style={{ background: colorFor(-0.5) }} /> under par
        <span className="inline-block h-3 w-3 rounded" style={{ background: colorFor(0) }} /> ~ par
        <span className="inline-block h-3 w-3 rounded" style={{ background: colorFor(1) }} /> bogey-ish
        <span className="inline-block h-3 w-3 rounded" style={{ background: colorFor(2.5) }} /> trouble
      </div>
    </div>
  );
}
