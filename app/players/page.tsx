import Link from "next/link";
import type { ReactNode } from "react";
import { Search, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth-utils";
import { listPublicPlayerStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const players = (await listPublicPlayerStats()).filter((player) =>
    query ? player.user.name.toLowerCase().includes(query) : true,
  );

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
          <Input name="q" defaultValue={q ?? ""} placeholder="Search players..." />
          <Button type="submit" variant="outline" size="icon" aria-label="Search players">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {players.length === 0 ? (
        <Card className="grid place-items-center p-12 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            No players match that search.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {players.map((player) => (
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
                        {player.roundsAllTime} round
                        {player.roundsAllTime === 1 ? "" : "s"} all time
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    <Trophy className="mr-1 h-3 w-3" />
                    {player.handicapIndex != null ? player.handicapIndex.toFixed(1) : "N/A"}
                  </Badge>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <Metric label="This year" value={player.roundsThisYear} />
                  <Metric label="Avg" value={formatNumber(player.avgScore)} />
                  <Metric label="Best" value={player.bestScore ?? "—"} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
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
