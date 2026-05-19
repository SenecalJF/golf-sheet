import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Medal,
  Search,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth-utils";
import {
  listPublicPlayerStats,
  type LeaderboardPeriod,
  type PublicPlayerStats,
} from "@/lib/data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; period?: string }>;
}) {
  await requireUser();
  const { q, period: rawPeriod } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const period = parsePeriod(rawPeriod);
  const allPlayers = await listPublicPlayerStats();
  const visiblePlayers = allPlayers.filter((player) =>
    query ? player.user.name.toLowerCase().includes(query) : true,
  );
  const mostImproved = findMostImprovedPlayer(visiblePlayers);
  const players = sortLeaderboard(visiblePlayers, period);
  const periodLabel = PERIOD_OPTIONS.find((item) => item.value === period)?.label ?? "All time";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Players</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Community stats</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aggregate-only profiles for every Golf Sheet user.
          </p>
        </div>
        <form className="flex w-full gap-2 sm:w-80">
          <input type="hidden" name="period" value={period} />
          <Input name="q" defaultValue={q ?? ""} placeholder="Search players..." />
          <Button type="submit" variant="outline" size="icon" aria-label="Search players">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={playersHref(option.value, q)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                period === option.value
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border/70 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {mostImproved ? (
        <Link href={`/players/${mostImproved.player.user.id}`} className="block">
          <Card className="border-primary/35 bg-primary/5 p-5 transition-colors hover:border-primary/55">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                    Most improved player
                  </div>
                  <h2 className="mt-1 truncate text-xl font-semibold tracking-tight">
                    {mostImproved.player.user.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Last 5 rounds are {formatNumber(mostImproved.improvedBy)} shots better
                    vs par than the previous 5.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:w-72">
                <Metric
                  label="Previous 5"
                  value={formatSigned(mostImproved.previousAvgVsPar)}
                />
                <Metric label="Last 5" value={formatSigned(mostImproved.recentAvgVsPar)} />
              </div>
            </div>
          </Card>
        </Link>
      ) : (
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Most improved player
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Needs at least 10 rounds from a player to compare last 5 vs previous 5.
              </p>
            </div>
          </div>
        </Card>
      )}

      {players.length === 0 ? (
        <Card className="grid place-items-center p-12 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            No players match that search.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {players.map((player, index) => {
            const stats = player.leaderboard[period];
            return (
              <Link key={player.user.id} href={`/players/${player.user.id}`} className="group">
                <Card className="h-full p-5 transition-colors group-hover:border-primary/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold tracking-tight group-hover:text-primary">
                          {player.user.name}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {stats.rounds} round{stats.rounds === 1 ? "" : "s"} · {periodLabel}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        <Medal className="mr-1 h-3 w-3" />
                        {stats.rounds > 0 ? `#${index + 1}` : "N/A"}
                      </Badge>
                      <Badge variant="outline" className="border-border/70 text-muted-foreground">
                        <Trophy className="mr-1 h-3 w-3" />
                        {player.handicapIndex != null
                          ? player.handicapIndex.toFixed(1)
                          : "HCP N/A"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <Metric label="Rounds" value={stats.rounds} />
                    <Metric label="Avg vs par" value={formatSigned(stats.avgVsPar)} />
                    <Metric label="Avg score" value={formatNumber(stats.avgScore)} />
                    <Metric label="Best" value={stats.bestScore ?? "—"} />
                  </div>

                  {stats.bestDifferential != null && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <BarChart3 className="h-3.5 w-3.5" />
                      Best differential {stats.bestDifferential.toFixed(1)}
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const PERIOD_OPTIONS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "all-time", label: "All time" },
  { value: "this-year", label: "This year" },
  { value: "last-5", label: "Last 5 rounds" },
];

function parsePeriod(value: string | undefined): LeaderboardPeriod {
  return value === "this-year" || value === "last-5" ? value : "all-time";
}

function playersHref(period: LeaderboardPeriod, q: string | undefined): string {
  const params = new URLSearchParams();
  const query = q?.trim();
  if (query) params.set("q", query);
  if (period !== "all-time") params.set("period", period);
  const qs = params.toString();
  return qs ? `/players?${qs}` : "/players";
}

function sortLeaderboard(
  players: PublicPlayerStats[],
  period: LeaderboardPeriod,
): PublicPlayerStats[] {
  return [...players].sort((a, b) => {
    const aStats = a.leaderboard[period];
    const bStats = b.leaderboard[period];
    if (aStats.rounds === 0 && bStats.rounds === 0) {
      return a.user.name.localeCompare(b.user.name);
    }
    if (aStats.rounds === 0) return 1;
    if (bStats.rounds === 0) return -1;

    const avgCompare = compareNullableLowIsBetter(aStats.avgVsPar, bStats.avgVsPar);
    if (avgCompare !== 0) return avgCompare;

    const diffCompare = compareNullableLowIsBetter(
      aStats.bestDifferential,
      bStats.bestDifferential,
    );
    if (diffCompare !== 0) return diffCompare;

    return bStats.rounds - aStats.rounds || a.user.name.localeCompare(b.user.name);
  });
}

function findMostImprovedPlayer(players: PublicPlayerStats[]):
  | {
      player: PublicPlayerStats;
      previousAvgVsPar: number;
      recentAvgVsPar: number;
      improvedBy: number;
    }
  | null {
  const candidates = players
    .map((player) => {
      if (player.roundsAllTime < 10) return null;
      const { previousAvgVsPar, recentAvgVsPar, delta } = player.recentTrend;
      if (previousAvgVsPar == null || recentAvgVsPar == null || delta == null) return null;
      if (delta >= 0) return null;
      return {
        player,
        previousAvgVsPar,
        recentAvgVsPar,
        improvedBy: Math.round(Math.abs(delta) * 10) / 10,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

  return candidates.sort(
    (a, b) =>
      b.improvedBy - a.improvedBy ||
      a.recentAvgVsPar - b.recentAvgVsPar ||
      a.player.user.name.localeCompare(b.player.user.name),
  )[0] ?? null;
}

function compareNullableLowIsBetter(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="number-mono mt-1 text-lg font-semibold">{value}</div>
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
