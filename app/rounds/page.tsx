import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Calendar, CheckCircle2, Clock, MapPin, Send, XCircle } from "lucide-react";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-utils";
import {
  getPendingRoundSummariesForUser,
  getRoundsPageForUser,
} from "@/lib/data";
import type { PendingRoundSummary } from "@/lib/data";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const PENDING_PREVIEW = 3;
const SENT_PREVIEW = 5;

export default async function RoundsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const user = await requireUser();
  const { cursor } = await searchParams;
  const isFirstPage = !cursor;

  const [{ rounds, nextCursor }, pendingRounds, totalRounds] = await Promise.all([
    getRoundsPageForUser(user.id, { take: PAGE_SIZE, cursor: cursor ?? null }),
    isFirstPage ? getPendingRoundSummariesForUser(user.id) : Promise.resolve(null),
    isFirstPage
      ? prisma.round.count({ where: { userId: user.id } })
      : Promise.resolve(null),
  ]);

  const receivedPending =
    pendingRounds?.received.filter((r) => r.status === "PENDING") ?? [];
  const sentPending =
    pendingRounds?.sent.filter((r) => r.status === "PENDING").slice(0, SENT_PREVIEW) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Rounds</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {isFirstPage
              ? `${totalRounds ?? 0} round${(totalRounds ?? 0) === 1 ? "" : "s"} logged`
              : "Older rounds"}
          </h1>
        </div>
        <Button asChild>
          <Link href="/rounds/new">
            <Camera className="mr-1 h-4 w-4" /> New round
          </Link>
        </Button>
      </div>

      {isFirstPage && receivedPending.length > 0 && (
        <PendingInboxPreview rounds={receivedPending} totalPending={receivedPending.length} />
      )}
      {isFirstPage && sentPending.length > 0 && <SentPendingRounds rounds={sentPending} />}

      {rounds.length === 0 ? (
        <Card className="grid place-items-center p-12 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            {isFirstPage
              ? "No rounds yet. Add your first one to start tracking your handicap."
              : "No more rounds to show."}
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
                    className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-secondary/30 sm:gap-4 sm:px-6"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                      <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary sm:grid">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{r.course.name}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {r.course.city}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{format(r.date, "MMM d, yyyy")}</span>
                          <span aria-hidden="true">·</span>
                          <span>{r.holeCount}H</span>
                          {r.excludeFromStats && (
                            <Badge
                              variant="outline"
                              className="border-border/60 px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
                            >
                              Casual
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="number-mono text-2xl font-semibold leading-none">
                        {r.totalStrokes}
                      </div>
                      <div className={scoreTone(over) + " mt-1"}>
                        {over >= 0 ? "+" : ""}
                        {over} vs par
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <div className="flex items-center justify-between text-sm">
        {!isFirstPage ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/rounds">← Back to latest</Link>
          </Button>
        ) : (
          <span />
        )}
        {nextCursor && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/rounds?cursor=${encodeURIComponent(nextCursor)}`}>Load older</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function PendingInboxPreview({
  rounds,
  totalPending,
}: {
  rounds: PendingRoundSummary[];
  totalPending: number;
}) {
  const visible = rounds.slice(0, PENDING_PREVIEW);
  const overflow = totalPending - visible.length;
  return (
    <Card className="overflow-hidden border-amber-500/30 bg-amber-500/5 p-0">
      <div className="flex flex-col gap-2 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4 text-amber-400" />
          Pending rounds for you
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-amber-500/40 text-amber-400">
            {totalPending} waiting
          </Badge>
          <Button asChild variant="ghost" size="sm">
            <Link href="/rounds/pending">Open inbox</Link>
          </Button>
        </div>
      </div>
      <ul className="divide-y divide-border/60">
        {visible.map((round) => {
          const over = round.totalStrokes - round.totalPar;
          return (
            <li key={round.id}>
              <Link
                href={`/rounds/pending/${round.id}`}
                className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-secondary/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="font-medium">
                    {round.scorecardPlayerName ??
                      round.scorecardRowLabel ??
                      "Shared scorecard row"}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>From {round.sender.name}</span>
                    <span>·</span>
                    <span>{round.course.name}</span>
                    <span>·</span>
                    <span>{format(round.date, "MMM d, yyyy")}</span>
                    <span>·</span>
                    <span>{round.holeCount}H</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <div className="number-mono text-2xl font-semibold">
                      {round.totalStrokes}
                    </div>
                    <div className={scoreTone(over)}>
                      {over >= 0 ? "+" : ""}
                      {over} vs par
                    </div>
                  </div>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-400">
                    Review
                  </Badge>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {overflow > 0 && (
        <div className="border-t border-border/60 px-4 py-2 text-center">
          <Link
            href="/rounds/pending"
            className="text-xs font-medium text-primary hover:underline"
          >
            +{overflow} more in inbox
          </Link>
        </div>
      )}
    </Card>
  );
}

function SentPendingRounds({ rounds }: { rounds: PendingRoundSummary[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 text-sm font-semibold">
        <Send className="h-4 w-4 text-primary" />
        Sent pending rounds
      </div>
      <ul className="divide-y divide-border/60">
        {rounds.map((round) => {
          const over = round.totalStrokes - round.totalPar;
          const acceptedRoundHref =
            round.status === "ACCEPTED" && round.acceptedRoundId
              ? `/rounds/${round.acceptedRoundId}`
              : null;
          const roundName =
            round.scorecardPlayerName ?? round.scorecardRowLabel ?? "Shared scorecard row";
          return (
            <li
              key={round.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                {acceptedRoundHref ? (
                  <Link href={acceptedRoundHref} className="font-medium hover:text-primary">
                    {roundName}
                  </Link>
                ) : (
                  <div className="font-medium">{roundName}</div>
                )}
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>To {round.recipient.name}</span>
                  <span>·</span>
                  <span>{round.course.name}</span>
                  <span>·</span>
                  <span>{format(round.date, "MMM d, yyyy")}</span>
                  <span>·</span>
                  <span>
                    {round.totalStrokes} ({over >= 0 ? "+" : ""}
                    {over})
                  </span>
                </div>
              </div>
              <StatusBadge status={round.status} />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function StatusBadge({ status }: { status: PendingRoundSummary["status"] }) {
  if (status === "ACCEPTED") {
    return (
      <Badge variant="outline" className="w-fit border-primary/40 text-primary">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Accepted
      </Badge>
    );
  }
  if (status === "REJECTED") {
    return (
      <Badge variant="outline" className="w-fit border-destructive/40 text-destructive">
        <XCircle className="mr-1 h-3 w-3" />
        Rejected
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="w-fit border-amber-500/40 text-amber-400">
      <Clock className="mr-1 h-3 w-3" />
      Pending
    </Badge>
  );
}

function scoreTone(over: number): string {
  return (
    "text-xs " +
    (over <= 0 ? "text-primary" : over < 5 ? "text-amber-400" : "text-destructive")
  );
}
