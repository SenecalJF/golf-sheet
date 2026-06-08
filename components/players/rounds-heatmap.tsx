"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RoundCalendar, RoundCalendarDay } from "@/lib/data";

type CalendarRound = RoundCalendarDay["rounds"][number];

type CalendarDay = {
  date: string;
  dayOfWeek: number;
  rounds: CalendarRound[];
};

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
  const calendarDays = React.useMemo(() => buildCalendarDays(year, byDate), [year, byDate]);
  const weeks = React.useMemo(() => chunkWeeks(calendarDays), [calendarDays]);
  const defaultSelected =
    [...calendarDays].reverse().find((day) => day.rounds.length > 0) ?? calendarDays[0];
  const [selectedDate, setSelectedDate] = React.useState(defaultSelected?.date ?? "");
  const selectedDay =
    calendarDays.find((day) => day.date === selectedDate) ?? defaultSelected ?? null;
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
                  setSelectedDate("");
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
            <div className="min-w-max">
              <div
                className="mb-2 grid gap-1 pl-8 text-[10px] text-muted-foreground"
                style={{ gridTemplateColumns: `repeat(${weeks.length}, 0.875rem)` }}
              >
                {weeks.map((week, index) => (
                  <div key={index} className="h-3">
                    {showMonthLabel(week, index, weeks) ? monthLabel(week) : ""}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="grid grid-rows-7 gap-1 pt-0.5 text-[10px] text-muted-foreground">
                  {DAY_LABELS.map((label, index) => (
                    <div key={label} className="flex h-3.5 items-center">
                      {index % 2 === 1 ? label : ""}
                    </div>
                  ))}
                </div>
                <div className="grid grid-flow-col grid-rows-7 gap-1">
                  {weeks.flatMap((week, weekIndex) =>
                    week.map((day, dayIndex) =>
                      day ? (
                        <button
                          key={day.date}
                          type="button"
                          aria-label={`${formatReadableDate(day.date)}: ${
                            day.rounds.length
                          } round${day.rounds.length === 1 ? "" : "s"}`}
                          title={`${formatReadableDate(day.date)} · ${day.rounds.length} round${
                            day.rounds.length === 1 ? "" : "s"
                          }`}
                          onClick={() => setSelectedDate(day.date)}
                          className={cn(
                            "h-3.5 w-3.5 rounded-[3px] border transition-transform active:scale-90",
                            heatClass(day.rounds.length),
                            selectedDay?.date === day.date &&
                              "ring-2 ring-primary ring-offset-2 ring-offset-background",
                          )}
                        />
                      ) : (
                        <div
                          key={`empty-${weekIndex}-${dayIndex}`}
                          className="h-3.5 w-3.5"
                        />
                      ),
                    ),
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                <span>Less</span>
                {[0, 1, 2, 3].map((count) => (
                  <span
                    key={count}
                    className={cn("h-3.5 w-3.5 rounded-[3px] border", heatClass(count))}
                  />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        <DayDetails day={selectedDay} />
      </div>
    </Card>
  );
}

function DayDetails({ day }: { day: CalendarDay | null }) {
  if (!day) {
    return (
      <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 text-sm text-muted-foreground">
        No calendar days available.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        {formatReadableDate(day.date)}
      </div>
      {day.rounds.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No rounds played on this day.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {day.rounds.map((round) => {
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
                      <MapPin className="h-3 w-3" />
                      <span>{round.city}</span>
                      <span>·</span>
                      <span>{round.holeCount}H</span>
                      {round.teeName && (
                        <>
                          <span>·</span>
                          <span>{round.teeName}</span>
                        </>
                      )}
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

function buildCalendarDays(year: number, byDate: Map<string, CalendarRound[]>): CalendarDay[] {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  const days: CalendarDay[] = [];

  for (let date = start; date <= end; date = addUtcDays(date, 1)) {
    const key = date.toISOString().slice(0, 10);
    days.push({
      date: key,
      dayOfWeek: date.getUTCDay(),
      rounds: byDate.get(key) ?? [],
    });
  }

  return days;
}

function chunkWeeks(days: CalendarDay[]): (CalendarDay | null)[][] {
  const weeks: (CalendarDay | null)[][] = [];
  let current: (CalendarDay | null)[] = [];

  for (let i = 0; i < days[0].dayOfWeek; i += 1) current.push(null);
  for (const day of days) {
    current.push(day);
    if (current.length === 7) {
      weeks.push(current);
      current = [];
    }
  }
  if (current.length > 0) {
    while (current.length < 7) current.push(null);
    weeks.push(current);
  }

  return weeks;
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function showMonthLabel(
  week: (CalendarDay | null)[],
  index: number,
  weeks: (CalendarDay | null)[][],
): boolean {
  const firstDay = week.find((day) => day != null);
  if (!firstDay) return false;
  if (index === 0) return true;
  const previous = [...(weeks[index - 1] ?? [])].reverse().find((day) => day != null);
  return previous ? monthLabel([previous]) !== monthLabel(week) : true;
}

function monthLabel(week: (CalendarDay | null)[]): string {
  const day = week.find((item) => item != null);
  if (!day) return "";
  return new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(
    new Date(`${day.date}T00:00:00Z`),
  );
}

function formatReadableDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function heatClass(rounds: number): string {
  if (rounds <= 0) return "border-border/60 bg-secondary/50";
  if (rounds === 1) return "border-primary/30 bg-primary/30 hover:bg-primary/40";
  if (rounds === 2) return "border-primary/50 bg-primary/55 hover:bg-primary/65";
  return "border-primary/70 bg-primary/80 hover:bg-primary/90";
}

function scoreTone(overPar: number): string {
  return (
    "text-xs " +
    (overPar <= 0 ? "text-primary" : overPar < 5 ? "text-warning" : "text-destructive")
  );
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
