import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Flag,
  GitCompareArrows,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth-utils";
import { getPublicPlayerStats } from "@/lib/data";
import type { ScoreFormatSummary } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const stats = await getPublicPlayerStats(id);
  if (!stats) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/players">
            <ArrowLeft className="mr-1 h-4 w-4" /> Players
          </Link>
        </Button>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-primary">Player</p>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight">
                {stats.user.name}
              </h1>
            </div>
          </div>
          <Badge variant="outline" className="border-primary/40 px-3 py-1 text-primary">
            Handicap {stats.handicapIndex != null ? stats.handicapIndex.toFixed(1) : "N/A"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={CalendarDays} label="Rounds all time" value={stats.roundsAllTime} />
        <SummaryCard icon={Flag} label="Rounds this year" value={stats.roundsThisYear} />
        <SummaryCard
          icon={BarChart3}
          label="18H average"
          value={formatNumber(stats.scoreByFormat[18].avg)}
        />
        <SummaryCard
          icon={Trophy}
          label="18H best"
          value={formatBest(stats.scoreByFormat[18])}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormatScoreCard label="18-hole scoring" stat={stats.scoreByFormat[18]} />
        <FormatScoreCard label="9-hole scoring" stat={stats.scoreByFormat[9]} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" /> Scoring
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Avg vs par" value={formatSigned(stats.avgVsPar)} />
            <Metric
              label="Best diff"
              value={stats.bestDifferential == null ? "—" : stats.bestDifferential.toFixed(1)}
            />
            <Metric
              label="Recent avg"
              value={formatSigned(stats.recentTrend.recentAvgVsPar)}
            />
            <Metric
              label="Trend"
              value={
                stats.recentTrend.delta == null
                  ? "—"
                  : `${stats.recentTrend.delta > 0 ? "+" : ""}${stats.recentTrend.delta.toFixed(1)}`
              }
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <GitCompareArrows className="h-3.5 w-3.5" /> Front/back
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Front avg" value={formatSigned(stats.frontBack.frontAvgVsPar)} />
            <Metric label="Back avg" value={formatSigned(stats.frontBack.backAvgVsPar)} />
            <Metric label="Avg swing" value={formatSigned(stats.frontBack.avgSwing)} />
            <Metric
              label="Back better/tied"
              value={
                stats.frontBack.backBetterOrTiedPct == null
                  ? "—"
                  : `${stats.frontBack.backBetterOrTiedPct}%`
              }
            />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Flag className="h-3.5 w-3.5" /> Most played courses
        </div>
        {stats.mostPlayedCourses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No course stats yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stats.mostPlayedCourses.map((course) => (
              <div
                key={course.courseId}
                className="rounded-xl border border-border/60 bg-secondary/40 p-4"
              >
                <div className="font-medium tracking-tight">{course.courseName}</div>
                <div className="text-xs text-muted-foreground">
                  {course.city} · {course.roundsPlayed} round
                  {course.roundsPlayed === 1 ? "" : "s"}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <CourseFormatMini label="18H avg" stat={course.byFormat[18]} />
                  <CourseFormatMini label="9H avg" stat={course.byFormat[9]} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function FormatScoreCard({ label, stat }: { label: string; stat: ScoreFormatSummary }) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Trophy className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Rounds" value={stat.rounds} />
        <Metric label="Best" value={formatBest(stat)} />
        <Metric label="Average" value={formatNumber(stat.avg)} />
        <Metric label="Avg vs par" value={formatSigned(stat.avgOverPar)} />
      </div>
    </Card>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="number-mono mt-3 text-3xl font-semibold">{value}</div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="number-mono mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function CourseFormatMini({ label, stat }: { label: string; stat: ScoreFormatSummary }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="number-mono mt-1 text-base font-semibold">
        {formatNumber(stat.avg)}
      </div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">
        {stat.rounds} round{stat.rounds === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function formatNumber(value: number | null): string {
  return value == null ? "—" : value.toFixed(1);
}

function formatSigned(value: number | null): string {
  if (value == null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
}

function formatBest(stat: ScoreFormatSummary): string {
  if (stat.best == null) return "—";
  if (stat.bestOverPar == null) return String(stat.best);
  return `${stat.best} (${stat.bestOverPar >= 0 ? "+" : ""}${stat.bestOverPar})`;
}
