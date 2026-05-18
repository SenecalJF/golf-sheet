import Link from "next/link";
import { ArrowRight, Calendar, Flag, MapPin, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildDifferentialsAndIndex } from "@/lib/handicap";
import { buildTrend, perCourseSummary, parTypeBreakdown } from "@/lib/stats";
import type { RoundFull } from "@/lib/stats";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { format } from "date-fns";

export function Dashboard({ rounds }: { rounds: RoundFull[] }) {
  const scoringRounds = rounds.map((r) => ({
    id: r.id,
    date: r.date,
    holeCount: r.holeCount as 9 | 18,
    nineType: (r.nineType ?? null) as "front" | "back" | null,
    totalStrokes: r.totalStrokes,
    pars: r.holes.map((h) => h.par),
    holeStrokes: r.holes.map((h) => h.strokes),
    rating: r.tee?.rating ?? null,
    slope: r.tee?.slope ?? null,
    rating9F: r.tee?.rating9F ?? null,
    slope9F: r.tee?.slope9F ?? null,
    rating9B: r.tee?.rating9B ?? null,
    slope9B: r.tee?.slope9B ?? null,
    pcc: r.pcc,
  }));

  const { diffs, index } = buildDifferentialsAndIndex(scoringRounds);
  const trend = buildTrend(rounds);
  const latest = rounds[0];
  const previousIndex = (() => {
    if (diffs.length <= 1) return null;
    const slice = diffs.slice(0, -1);
    return buildDifferentialsAndIndex(
      scoringRounds.filter((r) => slice.some((d) => Array.isArray(d.roundId) ? d.roundId.includes(r.id) : d.roundId === r.id)),
    ).index;
  })();
  const delta = previousIndex != null && index != null ? Math.round((index - previousIndex) * 10) / 10 : null;
  const courses = perCourseSummary(rounds).sort((a, b) => b.roundsPlayed - a.roundsPlayed).slice(0, 5);
  const parStats = parTypeBreakdown(rounds);

  const latestOverPar = latest.totalStrokes - latest.totalPar;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Your golf, distilled.</h1>
        </div>
        <Button asChild>
          <Link href="/rounds/new">
            New round <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* Handicap card */}
        <Card className="relative overflow-hidden p-6 md:col-span-1">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Trophy className="h-3.5 w-3.5" /> Handicap Index
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="number-mono text-6xl font-semibold leading-none tracking-tight">
                {index != null ? index.toFixed(1) : "—"}
              </span>
              {delta != null && (
                <Badge
                  variant="outline"
                  className={
                    delta < 0
                      ? "border-primary/40 text-primary"
                      : delta > 0
                        ? "border-destructive/40 text-destructive"
                        : ""
                  }
                >
                  {delta < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  <span className="ml-1">{Math.abs(delta).toFixed(1)}</span>
                </Badge>
              )}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {index != null
                ? `${Math.min(diffs.length, 20)} of last 20 differentials used`
                : "Add 3+ rounds at a course with rating + slope to see your handicap. The AI can read these from a scorecard photo."}
            </p>
          </div>
        </Card>

        {/* Latest round card */}
        <Card className="p-6 md:col-span-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> Latest round
          </div>
          <div className="mt-4">
            <Link
              href={`/rounds/${latest.id}`}
              className="text-lg font-semibold tracking-tight hover:text-primary"
            >
              {latest.course.name}
            </Link>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {latest.course.city}
              <span>·</span>
              {format(latest.date, "MMM d, yyyy")}
              <span>·</span>
              {latest.holeCount} holes
            </div>
          </div>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="number-mono text-5xl font-semibold tracking-tight">
              {latest.totalStrokes}
            </span>
            <Badge
              variant="outline"
              className={
                latestOverPar <= 0
                  ? "border-primary/40 text-primary"
                  : "border-amber-500/40 text-amber-400"
              }
            >
              {latestOverPar >= 0 ? "+" : ""}
              {latestOverPar} vs par {latest.totalPar}
            </Badge>
          </div>
        </Card>

        {/* Par type averages */}
        <Card className="p-6 md:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Flag className="h-3.5 w-3.5" /> Par-type averages
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4">
            {parStats.map((p) => (
              <div key={p.parType} className="rounded-xl bg-secondary/40 p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Par {p.parType}
                </div>
                <div className="number-mono mt-1 text-2xl font-semibold">{p.avg.toFixed(2)}</div>
                <div
                  className={
                    "mt-1 text-xs " +
                    (p.avgVsPar <= 0
                      ? "text-primary"
                      : p.avgVsPar < 1
                        ? "text-amber-400"
                        : "text-destructive")
                  }
                >
                  {p.avgVsPar >= 0 ? "+" : ""}
                  {p.avgVsPar.toFixed(2)} vs par
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {p.holes} holes
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Trend chart */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" /> Score trend
            </div>
            <h3 className="mt-1 text-lg font-semibold tracking-tight">
              Last {trend.length} rounds
            </h3>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/analytics">
              Open analytics <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <TrendChart trend={trend} handicap={index} />
      </Card>

      {/* Courses played */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> Courses played
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/courses">
              All courses <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c.courseId}
              href={`/courses/${c.courseId}`}
              className="group flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 p-4 transition-colors hover:border-primary/40"
            >
              <div>
                <div className="font-medium tracking-tight group-hover:text-primary">
                  {c.courseName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.city} · {c.roundsPlayed} round{c.roundsPlayed === 1 ? "" : "s"}
                </div>
              </div>
              <div className="text-right">
                <div className="number-mono text-lg">{c.best}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Best
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
