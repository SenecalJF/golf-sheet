import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Calendar, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function RoundsPage() {
  const rounds = await prisma.round.findMany({
    include: { course: true, tee: true },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Rounds</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {rounds.length} round{rounds.length === 1 ? "" : "s"} logged
          </h1>
        </div>
        <Button asChild>
          <Link href="/rounds/new">
            <Camera className="mr-1 h-4 w-4" /> New round
          </Link>
        </Button>
      </div>

      {rounds.length === 0 ? (
        <Card className="grid place-items-center p-12 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            No rounds yet. Add your first one to start tracking your handicap.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-border/60">
            {rounds.map((r) => {
              const over = r.totalStrokes - r.totalPar;
              return (
                <li key={r.id}>
                  <Link
                    href={`/rounds/${r.id}`}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-secondary/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{r.course.name}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {r.course.city}
                          <span>·</span>
                          {format(r.date, "MMM d, yyyy")}
                          <span>·</span>
                          {r.holeCount}H
                          {r.tee && (
                            <>
                              <span>·</span>
                              {r.tee.name}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="number-mono text-2xl font-semibold">
                          {r.totalStrokes}
                        </div>
                        <div
                          className={
                            "text-xs " +
                            (over <= 0
                              ? "text-primary"
                              : over < 5
                                ? "text-amber-400"
                                : "text-destructive")
                          }
                        >
                          {over >= 0 ? "+" : ""}
                          {over} vs par
                        </div>
                      </div>
                      {r.scoreDiff != null && (
                        <Badge variant="outline">Diff {r.scoreDiff.toFixed(1)}</Badge>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
