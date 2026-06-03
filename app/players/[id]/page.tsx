import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Flag,
  GitCompareArrows,
  MapPin,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlayerPhoto } from "@/components/players/player-photo";
import { RoundsHeatmap } from "@/components/players/rounds-heatmap";
import { requireUser } from "@/lib/auth-utils";
import { getPublicPlayerStats, type PublicPlayerStats } from "@/lib/data";
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
  const profileImage =
    stats.user.image ?? stats.tournamentIdentities.find((item) => item.image)?.image ?? null;

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
            <PlayerPhoto
              src={profileImage}
              alt={`${stats.user.name} profile photo`}
              className="h-16 w-16 rounded-2xl"
            />
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

      <RecentRounds rounds={stats.recentRounds} />

      {stats.tournamentIdentities.some((identity) => identity.image) && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" /> Tournament photos
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {stats.tournamentIdentities
              .filter((identity) => identity.image)
              .map((identity) => (
                <div
                  key={identity.id}
                  className="overflow-hidden rounded-xl border border-border/60 bg-secondary/40"
                >
                  <div className="relative h-56 bg-secondary">
                    <PlayerPhoto
                      src={identity.image}
                      alt={`${identity.displayName} ${identity.year} tournament photo`}
                      className="h-full w-full rounded-none"
                      sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                      fill
                    />
                  </div>
                  <div className="p-4">
                    <div className="font-medium tracking-tight">{identity.displayName}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {identity.year} ·{" "}
                      {identity.teamName ?? identity.nickname ?? identity.role.toLowerCase()}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Metric label="Solo wins" value={identity.individualWins} />
                      <Metric label="Team wins" value={identity.teamWins} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      <RoundsHeatmap calendars={stats.roundCalendars} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" /> Scoring
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="18H avg vs par" value={formatSigned(stats.avgVsPar)} />
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

function RecentRounds({ rounds }: { rounds: PublicPlayerStats["recentRounds"] }) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" /> Recent rounds
      </div>
      {rounds.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rounds yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rounds.map((round) => {
            const overPar = round.totalStrokes - round.totalPar;
            return (
              <Link
                key={round.id}
                href={`/rounds/${round.id}`}
                className="rounded-xl border border-border/60 bg-secondary/40 p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium tracking-tight">
                      {round.courseName}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{round.city}</span>
                      <span>·</span>
                      <span>{formatRoundDate(round.date)}</span>
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
                  <div className="shrink-0 text-right">
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
                  <div className="mt-3 text-xs text-muted-foreground">
                    Differential {round.scoreDiff.toFixed(1)}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </Card>
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

function formatRoundDate(date: Date): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    date,
  );
}

function scoreTone(over: number): string {
  return (
    "text-xs " +
    (over <= 0 ? "text-primary" : over < 5 ? "text-amber-400" : "text-destructive")
  );
}
