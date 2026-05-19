"use client";

import * as React from "react";
import { ChevronsLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type GridHole = {
  holeNumber: number;
  par: number;
  strokes: number | null;
  putts?: number | null;
  confidence?: number | null;
  illegible?: boolean;
};

export function HoleScoreGrid({
  holes,
  onChange,
  showPutts = false,
  showConfidence = true,
  readOnly = false,
}: {
  holes: GridHole[];
  onChange?: (next: GridHole[]) => void;
  showPutts?: boolean;
  showConfidence?: boolean;
  readOnly?: boolean;
}) {
  const update = (idx: number, patch: Partial<GridHole>) => {
    if (!onChange) return;
    const next = [...holes];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const totalStrokes = holes.reduce((s, h) => s + (h.strokes ?? 0), 0);
  const totalPar = holes.reduce((s, h) => s + h.par, 0);
  const over = totalStrokes - totalPar;

  const half = Math.floor(holes.length / 2);
  const showSplit = holes.length === 18;

  const renderRow = (rowHoles: GridHole[], offset: number) => (
    <div
      className="grid gap-1 sm:gap-1.5"
      style={{ gridTemplateColumns: `repeat(${rowHoles.length}, minmax(0, 1fr))` }}
    >
      {rowHoles.map((h, i) => {
        const idx = i + offset;
        const conf = h.confidence ?? null;
        const confColor =
          h.illegible
            ? "border-destructive/60 bg-destructive/10"
            : conf == null
              ? ""
              : conf >= 0.85
                ? "border-primary/40"
                : conf >= 0.6
                  ? "border-amber-500/40"
                  : "border-destructive/40 bg-destructive/5";
        const overPar = h.strokes != null ? h.strokes - h.par : null;
        return (
          <div key={h.holeNumber} className="flex min-w-0 flex-col items-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {h.holeNumber}
            </div>
            <div className="text-[10px] text-muted-foreground">par {h.par}</div>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={15}
              value={h.strokes ?? ""}
              placeholder={h.illegible ? "?" : ""}
              disabled={readOnly}
              onChange={(e) => {
                const v = e.target.value;
                update(idx, {
                  strokes: v === "" ? null : Math.max(1, Math.min(15, Number(v))),
                  illegible: v === "" ? h.illegible : false,
                });
              }}
              className={cn(
                "number-mono mt-1 h-10 w-full min-w-0 px-1 text-center text-base font-semibold sm:h-11 sm:text-lg",
                confColor,
              )}
            />
            {overPar != null && (
              <div
                className={cn(
                  "mt-0.5 text-[10px]",
                  overPar < 0
                    ? "text-primary"
                    : overPar === 0
                      ? "text-muted-foreground"
                      : overPar === 1
                        ? "text-amber-400"
                        : "text-destructive",
                )}
              >
                {overPar > 0 ? "+" : ""}
                {overPar}
              </div>
            )}
            {showPutts && (
              <Input
                type="number"
                min={0}
                max={8}
                value={h.putts ?? ""}
                disabled={readOnly}
                onChange={(e) => {
                  const v = e.target.value;
                  update(idx, { putts: v === "" ? null : Number(v) });
                }}
                placeholder="putts"
                className="mt-1 h-7 w-full px-1 text-center text-xs text-muted-foreground"
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const wrap = (node: React.ReactNode) => (
    <div className="relative -mx-1 sm:mx-0">
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-card via-card/80 to-transparent sm:hidden" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-border/70 bg-background/85 text-muted-foreground shadow-sm backdrop-blur-sm sm:hidden"
      >
        <ChevronsLeftRight className="h-4 w-4" />
      </div>
      <div
        aria-label="Scrollable hole scores"
        className="overflow-x-auto px-1 pb-2 [scrollbar-width:thin] sm:overflow-visible sm:px-0 sm:pb-0"
      >
        <div className="min-w-[420px]">{node}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {showSplit ? (
        <>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              Front 9
            </div>
            {wrap(renderRow(holes.slice(0, half), 0))}
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              Back 9
            </div>
            {wrap(renderRow(holes.slice(half), half))}
          </div>
        </>
      ) : (
        wrap(renderRow(holes, 0))
      )}

      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 px-4 py-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Total
        </div>
        <div className="flex items-baseline gap-3">
          <span className="number-mono text-3xl font-semibold">{totalStrokes}</span>
          <span className="text-xs text-muted-foreground">
            par {totalPar} ·{" "}
            <span
              className={
                over <= 0
                  ? "text-primary"
                  : over < 5
                    ? "text-amber-400"
                    : "text-destructive"
              }
            >
              {over >= 0 ? "+" : ""}
              {over}
            </span>
          </span>
        </div>
      </div>
      {showConfidence && holes.some((h) => h.confidence != null) && (
        <div className="text-[11px] text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-primary mr-1.5" /> high confidence
          <span className="ml-3 inline-block h-2 w-2 rounded-full bg-amber-400 mr-1.5" /> review
          <span className="ml-3 inline-block h-2 w-2 rounded-full bg-destructive mr-1.5" /> illegible — please fill in
        </div>
      )}
    </div>
  );
}
