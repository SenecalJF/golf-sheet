"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RoundCalendar, RoundCalendarDay } from "@/lib/data";

type CalendarRound = RoundCalendarDay["rounds"][number];
type WeekRound = CalendarRound & { date: string };

type MonthWeek = {
  month: number;
  weekOfMonth: number;
  startDate: string;
  endDate: string;
  rounds: WeekRound[];
};

const DAY_MS = 86_400_000;
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function RoundsHeatmap({
  calendars,
}: {
  calendars: RoundCalendar[];
}) {
  const fallbackYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = React.useState(
    calendars[0]?.year ?? fallbackYear,
  );
  const activeCalendar =
    calendars.find((calendar) => calendar.year === selectedYear) ??
    calendars[0] ?? { year: fallbackYear, days: [] };
  const { year, days } = activeCalendar;
  const byDate = React.useMemo(
    () => new Map(days.map((day) => [day.date, day.rounds])),
    [days],
  );
  const months = React.useMemo(() => buildMonthWeeks(year, byDate), [year, byDate]);
  const maxRows = React.useMemo(
    () => Math.max(1, ...months.map((weeks) => weeks.length)),
    [months],
  );
  const defaultSelected = React.useMemo(() => {
    const all = months.flat();
    return [...all].reverse().find((week) => week.rounds.length > 0) ?? all[0] ?? null;
  }, [months]);
  const [selectedKey, setSelectedKey] = React.useState("");
  const selectedWeek =
    months.flat().find((week) => weekKey(week) === selectedKey) ?? defaultSelected;
  const totalRounds = days.reduce((sum, day) => sum + day.rounds.length, 0);

  return (
    <Card className="p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> Rounds calendar
          </div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">{year}</h2>
        </div>
        <div className="space-y-2 sm:text-right">
          <div className="text-sm text-muted-foreground">
            {totalRounds} round{totalRounds === 1 ? "" : "s"} played
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {calendars.map((calendar) => (
              <button
                key={calendar.year}
                type="button"
                onClick={() => {
                  setSelectedYear(calendar.year);
                  setSelectedKey("");
                }}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  calendar.year === year
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border/70 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {calendar.year}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <div className="-mx-2 overflow-x-auto px-2 pb-2 [scrollbar-width:thin]">
            <div className="min-w-[34rem] space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-7 shrink-0" />
                <div className="grid flex-1 grid-cols-[repeat(12,minmax(0,1fr))] gap-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
                  {MONTH_LABELS.map((label) => (
                    <div key={label}>{label}</div>
                  ))}
                </div>
              </div>

              {Array.from({ length: maxRows }, (_, rowIndex) => (
                <div key={rowIndex} className="flex items-center gap-1.5">
                  <div className="w-7 shrink-0 text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                    W{rowIndex + 1}
                  </div>
                  <div className="grid flex-1 grid-cols-[repeat(12,minmax(0,1fr))] gap-1">
                    {months.map((weeks, monthIndex) => {
                      const week = weeks[rowIndex];
                      if (!week) {
                        return (
                          <div
                            key={`${monthIndex}-${rowIndex}`}
                            className="aspect-square w-full"
                          />
                        );
                      }
                      return (
                        <button
                          key={weekKey(week)}
                          type="button"
                          aria-label={`${formatWeekRange(week)}: ${
                            week.rounds.length
                          } round${week.rounds.length === 1 ? "" : "s"}`}
                          title={`${formatWeekRange(week)} · ${week.rounds.length} round${
                            week.rounds.length === 1 ? "" : "s"
                          }`}
                          onClick={() => setSelectedKey(weekKey(week))}
                          className={cn(
                            "aspect-square w-full rounded-md border transition-transform active:scale-90",
                            weekClass(week.rounds.length),
                            selectedWeek && weekKey(selectedWeek) === weekKey(week) &&
                              "ring-2 ring-primary ring-offset-2 ring-offset-background",
                          )}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Columns are months, rows are weeks — brighter means more rounds played.
          </p>
          <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((count) => (
              <span
                key={count}
                className={cn("h-3.5 w-3.5 rounded-[3px] border", weekClass(count))}
              />
            ))}
            <span>More</span>
          </div>
        </div>

        <WeekDetails week={selectedWeek} />
      </div>
    </Card>
  );
}

function WeekDetails({ week }: { week: MonthWeek | null }) {
  if (!week) {
    return (
      <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 text-sm text-muted-foreground">
        No calendar weeks available.
      </div>
    );
  }

  const rounds = [...week.rounds].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        {MONTH_LABELS[week.month]} · week {week.weekOfMonth}
      </div>
      <div className="mt-0.5 text-sm text-muted-foreground">{formatWeekRange(week)}</div>
      {rounds.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No rounds played this week.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {rounds.map((round) => {
            const overPar = round.totalStrokes - round.totalPar;
            return (
              <Link
                key={round.id}
                href={`/rounds/${round.id}`}
                className="block rounded-lg border border-border/60 bg-card/70 p-3 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{round.courseName}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{formatReadableDate(round.date)}</span>
                      <span>·</span>
                      <MapPin className="h-3 w-3" />
                      <span>{round.city}</span>
                      <span>·</span>
                      <span>{round.holeCount}H</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="number-mono text-2xl font-semibold">
                      {round.totalStrokes}
                    </div>
                    <div className={scoreTone(overPar)}>
                      {overPar >= 0 ? "+" : ""}
                      {overPar} vs par
                    </div>
                  </div>
                </div>
                {round.scoreDiff != null && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Differential {round.scoreDiff.toFixed(1)}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildMonthWeeks(
  year: number,
  byDate: Map<string, CalendarRound[]>,
): MonthWeek[][] {
  const months: MonthWeek[][] = Array.from({ length: 12 }, () => []);
  const buckets = new Map<string, MonthWeek>();
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year, 11, 31);

  for (let d = start; d <= end; d += DAY_MS) {
    const date = new Date(d);
    const month = date.getUTCMonth();
    const weekOfMonth = Math.ceil(date.getUTCDate() / 7);
    const dateKey = date.toISOString().slice(0, 10);
    const key = `${month}-${weekOfMonth}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { month, weekOfMonth, startDate: dateKey, endDate: dateKey, rounds: [] };
      buckets.set(key, bucket);
      months[month].push(bucket);
    }
    bucket.endDate = dateKey;
    for (const round of byDate.get(dateKey) ?? []) {
      bucket.rounds.push({ ...round, date: dateKey });
    }
  }

  return months;
}

function weekKey(week: MonthWeek): string {
  return `${week.month}-${week.weekOfMonth}`;
}

function formatWeekRange(week: MonthWeek): string {
  if (!week.startDate) return "";
  const start = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${week.startDate}T00:00:00Z`));
  const end = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${week.endDate}T00:00:00Z`));
  return start === end ? start : `${start} – ${end}`;
}

function formatReadableDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function weekClass(rounds: number): string {
  if (rounds <= 0) return "border-border/60 bg-secondary/50";
  if (rounds === 1) return "border-primary/30 bg-primary/25 hover:bg-primary/35";
  if (rounds === 2) return "border-primary/45 bg-primary/45 hover:bg-primary/55";
  if (rounds === 3) return "border-primary/60 bg-primary/65 hover:bg-primary/75";
  return "border-primary/75 bg-primary/85 hover:bg-primary/95";
}

function scoreTone(overPar: number): string {
  return (
    "text-xs " +
    (overPar <= 0 ? "text-primary" : overPar < 5 ? "text-warning" : "text-destructive")
  );
}
