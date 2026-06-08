"use client";

import * as React from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { HoleHistoryEntry, HoleHistoryHole } from "@/lib/stats";

export function HoleHistoryPanel({
  holes,
  courseSelected,
  courseName,
}: {
  holes: HoleHistoryHole[];
  courseSelected: boolean;
  courseName: string | null;
}) {
  const byHole = React.useMemo(
    () => new Map(holes.map((hole) => [hole.holeNumber, hole])),
    [holes],
  );
  const firstAvailable = holes[0]?.holeNumber ?? null;
  const [selectedHoleNumber, setSelectedHoleNumber] = React.useState<number | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const activeHoleNumber =
    selectedHoleNumber != null && byHole.has(selectedHoleNumber)
      ? selectedHoleNumber
      : firstAvailable;
  const selectedHole = activeHoleNumber == null ? null : byHole.get(activeHoleNumber) ?? null;
  const holeNumbers = React.useMemo(() => Array.from({ length: 18 }, (_, index) => index + 1), []);

  function selectHole(holeNumber: number) {
    setSelectedHoleNumber(holeNumber);
    if (!isDesktop) setMobileDetailOpen(true);
  }

  if (!courseSelected) {
    return (
      <div className="grid min-h-64 place-items-center rounded-lg border border-border/60 bg-secondary/20 p-6 text-center">
        <div>
          <div className="text-base font-semibold tracking-tight">Choose a course</div>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Hole history is shown course by course so each hole number stays comparable.
          </p>
        </div>
      </div>
    );
  }

  if (holes.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center rounded-lg border border-border/60 bg-secondary/20 p-6 text-center">
        <div>
          <div className="text-base font-semibold tracking-tight">No hole history yet</div>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            No rounds match the selected course and round-length filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm font-semibold tracking-tight">
            {courseName ?? "Selected course"}
          </div>
          <div className="text-xs text-muted-foreground">
            {holes.reduce((sum, hole) => sum + hole.rounds, 0)} hole scores logged
          </div>
        </div>
        {selectedHole && (
          <div className="text-xs text-muted-foreground sm:text-right">
            H{selectedHole.holeNumber} selected
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-9">
        {holeNumbers.map((holeNumber) => {
          const hole = byHole.get(holeNumber) ?? null;
          const selected = activeHoleNumber === holeNumber;
          return (
            <button
              key={holeNumber}
              type="button"
              disabled={!hole}
              onClick={() => selectHole(holeNumber)}
              className={cn(
                "min-h-32 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                hole
                  ? "border-border/70 bg-secondary/25 hover:border-primary/45"
                  : "cursor-not-allowed border-border/40 bg-secondary/10 opacity-45",
                selected && "border-primary/70 bg-primary/10 ring-2 ring-primary/25",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  H{holeNumber}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {hole ? `p${hole.par}` : "-"}
                </span>
              </div>
              {hole ? (
                <>
                  <div className="number-mono mt-2 text-2xl font-semibold">
                    {hole.avgStrokes.toFixed(1)}
                  </div>
                  <div className={cn("text-xs", scoreTone(hole.avgVsPar))}>
                    {formatSigned(hole.avgVsPar)} avg
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                    <span>
                      {hole.rounds} round{hole.rounds === 1 ? "" : "s"}
                    </span>
                    <span className="text-right">
                      Best {formatScore(hole.bestStrokes, hole.bestVsPar)}
                    </span>
                    <span className="col-span-2">
                      Worst {formatScore(hole.worstStrokes, hole.worstVsPar)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="mt-8 text-xs text-muted-foreground">No data</div>
              )}
            </button>
          );
        })}
      </div>

      {selectedHole && (
        <>
          <div className="hidden lg:block">
            <SelectedHoleDetail hole={selectedHole} />
          </div>
          <Sheet open={mobileDetailOpen && !isDesktop} onOpenChange={setMobileDetailOpen}>
            <SheetContent
              side="bottom"
              className="max-h-[88vh] rounded-t-2xl border-border/70 p-0 lg:hidden"
            >
              <SheetHeader className="border-b border-border/60 pr-12">
                <SheetTitle>Hole {selectedHole.holeNumber}</SheetTitle>
                <SheetDescription>
                  Par {selectedHole.par} - {selectedHole.rounds} round
                  {selectedHole.rounds === 1 ? "" : "s"} - {formatSigned(selectedHole.avgVsPar)} avg
                </SheetDescription>
              </SheetHeader>
              <div className="overflow-y-auto p-4 [scrollbar-width:thin]">
                <SelectedHoleDetail hole={selectedHole} compact />
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}

function SelectedHoleDetail({
  hole,
  compact = false,
}: {
  hole: HoleHistoryHole;
  compact?: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold tracking-tight">Hole {hole.holeNumber} trend</h4>
            <p className="text-xs text-muted-foreground">
              Par {hole.par} - {hole.rounds} round{hole.rounds === 1 ? "" : "s"}
            </p>
          </div>
          <div className={cn("number-mono text-sm font-semibold", scoreTone(hole.avgVsPar))}>
            {formatSigned(hole.avgVsPar)} avg
          </div>
        </div>
        <div className={cn("w-full", compact ? "h-56" : "h-72")}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hole.entries} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => String(value).slice(5)}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                stroke="var(--border)"
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                stroke="var(--border)"
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
                formatter={(
                  (value: unknown, _name: unknown, item: { payload: HoleHistoryEntry }) => {
                    const entry = item.payload;
                    return [`${value} (${formatSigned(entry.vsPar)})`, "Score"];
                  }
                ) as never}
                labelFormatter={(value, payload) => {
                  const entry = payload?.[0]?.payload as HoleHistoryEntry | undefined;
                  return entry ? `${entry.course} - ${formatDate(entry.date)}` : value;
                }}
              />
              <ReferenceLine
                y={hole.par}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey="strokes"
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold tracking-tight">Round history</h4>
          <span className="text-xs text-muted-foreground">{hole.entries.length}</span>
        </div>
        <div
          className={cn(
            "space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]",
            compact ? "max-h-none" : "max-h-80",
          )}
        >
          {hole.entries.map((entry) => (
            <Link
              key={entry.roundId}
              href={`/rounds/${entry.roundId}`}
              className="block rounded-lg border border-border/60 bg-card/70 p-3 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{formatDate(entry.date)}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{entry.holeCount}H</span>
                    {entry.teeName && (
                      <>
                        <span>-</span>
                        <span className="truncate">{entry.teeName} tees</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="number-mono text-xl font-semibold">{entry.strokes}</div>
                  <div className={cn("text-xs", scoreTone(entry.vsPar))}>
                    {formatSigned(entry.vsPar)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  React.useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

function formatScore(strokes: number, vsPar: number) {
  return `${strokes} (${formatSigned(vsPar)})`;
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1).replace(/\.0$/, "")}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function scoreTone(vsPar: number) {
  if (vsPar < 0) return "text-primary";
  if (vsPar === 0) return "text-muted-foreground";
  if (vsPar <= 1) return "text-warning";
  return "text-destructive";
}
