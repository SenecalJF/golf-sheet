"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, ChevronsLeftRight } from "lucide-react";
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
  const [activeIdx, setActiveIdx] = React.useState(0);

  const update = (idx: number, patch: Partial<GridHole>) => {
    if (!onChange) return;
    const next = [...holes];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const safeActiveIdx =
    holes.length > 0 ? Math.min(Math.max(activeIdx, 0), holes.length - 1) : 0;
  const activeHole = holes[safeActiveIdx] ?? null;
  const hasAiConfidence = holes.some((h) => h.confidence != null || h.illegible);
  const reviewIssues = holes
    .map((hole, idx) => ({ hole, idx }))
    .filter(({ hole }) => hole.illegible || hole.strokes == null || (hole.confidence ?? 1) < 0.85);

  const setScore = (idx: number, strokes: number | null, advance = false) => {
    const hole = holes[idx];
    if (!hole) return;
    update(idx, {
      strokes: strokes == null ? null : Math.max(1, Math.min(15, strokes)),
      illegible: false,
    });
    if (advance) {
      setActiveIdx(Math.min(idx + 1, holes.length - 1));
    }
  };

  const setRelativeScore = (idx: number, delta: number, advance = false) => {
    const hole = holes[idx];
    if (!hole) return;
    setScore(idx, hole.par + delta, advance);
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
                  ? "border-warning/40"
                  : "border-destructive/40 bg-destructive/5";
        const overPar = h.strokes != null ? h.strokes - h.par : null;
        return (
          <div key={h.holeNumber} className="flex min-w-0 flex-col items-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {h.holeNumber}
            </div>
            <div className="text-[10px] text-muted-foreground">par {h.par}</div>
            {readOnly ? (
              <div
                aria-label={`Hole ${h.holeNumber}: ${h.strokes ?? "no score"} strokes${overPar == null ? "" : `, ${scoreTerm(overPar)}`}`}
                className="number-mono relative mt-1 grid h-10 w-full min-w-0 place-items-center rounded-md bg-secondary/25 px-1 text-center text-base font-semibold sm:h-11 sm:text-lg"
              >
                <ScorecardMark overPar={overPar} />
                <span className="relative z-10">{h.strokes ?? (h.illegible ? "?" : "—")}</span>
              </div>
            ) : (
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={15}
                value={h.strokes ?? ""}
                aria-label={`Hole ${h.holeNumber} strokes`}
                placeholder={h.illegible ? "?" : ""}
                onFocus={() => setActiveIdx(idx)}
                onChange={(e) => {
                  const v = e.target.value;
                  setActiveIdx(idx);
                  update(idx, {
                    strokes: v === "" ? null : Math.max(1, Math.min(15, Number(v))),
                    illegible: v === "" ? h.illegible : false,
                  });
                }}
                className={cn(
                  "number-mono mt-1 h-10 w-full min-w-0 px-1 text-center text-base font-semibold sm:h-11 sm:text-lg",
                  confColor,
                  safeActiveIdx === idx && "border-primary/70 ring-2 ring-primary/40",
                )}
              />
            )}
            {overPar != null && (
              <div
                className={cn(
                  "mt-0.5 text-[10px]",
                  overPar < 0
                    ? "text-primary"
                    : overPar === 0
                      ? "text-muted-foreground"
                      : overPar === 1
                        ? "text-warning"
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
                onFocus={() => setActiveIdx(idx)}
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
        className="pointer-events-none absolute right-0 top-1/2 z-20 grid h-8 w-8 translate-x-2 -translate-y-1/2 place-items-center rounded-full border border-border/70 bg-background/85 text-muted-foreground shadow-sm backdrop-blur-sm sm:hidden"
      >
        <ChevronsLeftRight className="h-4 w-4" />
      </div>
      <div
        aria-label="Scrollable hole scores"
        className="overflow-x-auto pb-2 pl-1 pr-12 [scrollbar-width:thin] sm:overflow-visible sm:px-0 sm:pb-0"
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

      {!readOnly && activeHole && (
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 lg:hidden">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Quick score
              </div>
              <div className="text-sm font-medium">
                Hole {activeHole.holeNumber} · par {activeHole.par}
              </div>
            </div>
            <div
              className={cn(
                "number-mono rounded-lg border border-border/60 bg-card px-3 py-1.5 text-lg font-semibold",
                activeHole.strokes == null && "text-muted-foreground",
              )}
            >
              {activeHole.strokes ?? "—"}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_SCORE_DELTAS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setRelativeScore(safeActiveIdx, item.delta, true)}
                className={cn(
                  "number-mono h-11 rounded-lg border border-border/70 bg-card text-sm font-semibold transition-colors active:translate-y-px",
                  item.delta < 0
                    ? "text-primary"
                    : item.delta === 0
                      ? "text-foreground"
                      : item.delta === 1
                        ? "text-warning"
                        : "text-destructive",
                )}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setScore(safeActiveIdx, null)}
              className="h-11 rounded-lg border border-border/70 bg-card text-sm font-medium text-muted-foreground transition-colors active:translate-y-px"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {showConfidence && !readOnly && hasAiConfidence && (
        <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/25 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              {reviewIssues.length > 0 ? (
                <AlertTriangle className="h-4 w-4 text-warning" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
              {reviewIssues.length > 0
                ? `${reviewIssues.length} hole${reviewIssues.length === 1 ? "" : "s"} to review`
                : "AI read looks clean"}
            </div>
            <ChevronsLeftRight className="h-4 w-4 text-muted-foreground lg:hidden" />
          </div>
          <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            <div className="flex min-w-max snap-x snap-mandatory gap-2">
              {holes.map((hole, idx) => {
                const status = confidenceStatus(hole);
                return (
                  <div
                    key={hole.holeNumber}
                    className={cn(
                      "w-36 snap-start rounded-xl border bg-card/70 p-3",
                      safeActiveIdx === idx && "border-primary/60 ring-2 ring-primary/30",
                      status.tone === "bad" && "border-destructive/50",
                      status.tone === "warn" && "border-warning/50",
                      status.tone === "good" && "border-primary/30",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      className="block w-full text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          Hole {hole.holeNumber}
                        </div>
                        <div className={cn("text-[10px]", status.className)}>
                          {status.label}
                        </div>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <div className="text-xs text-muted-foreground">par {hole.par}</div>
                        <div className="number-mono text-2xl font-semibold">
                          {hole.strokes ?? "—"}
                        </div>
                      </div>
                    </button>
                    <div className="mt-2 grid grid-cols-3 gap-1">
                      {REVIEW_SCORE_DELTAS.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setRelativeScore(idx, item.delta)}
                          className="number-mono h-8 rounded-md border border-border/60 bg-secondary/40 text-xs font-semibold active:translate-y-px"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
                    ? "text-warning"
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
          <span className="ml-3 inline-block h-2 w-2 rounded-full bg-warning mr-1.5" /> review
          <span className="ml-3 inline-block h-2 w-2 rounded-full bg-destructive mr-1.5" /> illegible — please fill in
        </div>
      )}
    </div>
  );
}

const QUICK_SCORE_DELTAS = [
  { label: "-2", delta: -2 },
  { label: "-1", delta: -1 },
  { label: "\\", delta: 0 },
  { label: "+1", delta: 1 },
  { label: "+2", delta: 2 },
  { label: "+3", delta: 3 },
  { label: "+4", delta: 4 },
];

const REVIEW_SCORE_DELTAS = [
  { label: "\\", delta: 0 },
  { label: "+1", delta: 1 },
  { label: "+2", delta: 2 },
];

function ScorecardMark({ overPar }: { overPar: number | null }) {
  if (overPar == null || overPar === 0) return null;
  const isCircle = overPar < 0;
  const isDouble = overPar <= -2 || overPar >= 2;
  const shape = isCircle ? "rounded-full" : "rounded-[4px]";
  const tone =
    overPar < 0
      ? "border-primary/85"
      : overPar === 1
        ? "border-warning/85"
        : "border-destructive/80";

  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 border-2 sm:h-9 sm:w-9",
          shape,
          tone,
        )}
      />
      {isDouble && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 border sm:h-7 sm:w-7",
            shape,
            tone,
          )}
        />
      )}
    </>
  );
}

function scoreTerm(overPar: number) {
  if (overPar <= -2) return "eagle or better";
  if (overPar === -1) return "birdie";
  if (overPar === 0) return "par";
  if (overPar === 1) return "bogey";
  if (overPar === 2) return "double bogey";
  return "triple bogey or worse";
}

function confidenceStatus(hole: GridHole): {
  label: string;
  tone: "good" | "warn" | "bad" | "neutral";
  className: string;
} {
  if (hole.illegible || hole.strokes == null) {
    return { label: "Fix", tone: "bad", className: "text-destructive" };
  }
  if (hole.confidence == null) {
    return { label: "Manual", tone: "neutral", className: "text-muted-foreground" };
  }
  if (hole.confidence >= 0.85) {
    return {
      label: `${Math.round(hole.confidence * 100)}%`,
      tone: "good",
      className: "text-primary",
    };
  }
  if (hole.confidence >= 0.6) {
    return {
      label: `${Math.round(hole.confidence * 100)}%`,
      tone: "warn",
      className: "text-warning",
    };
  }
  return {
    label: `${Math.round(hole.confidence * 100)}%`,
    tone: "bad",
    className: "text-destructive",
  };
}
