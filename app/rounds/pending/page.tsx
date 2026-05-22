import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Inbox, XCircle } from "lucide-react";
import { format } from "date-fns";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth-utils";
import {
  getReceivedPendingRoundsPageForUser,
  type PendingRoundSummary,
} from "@/lib/data";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export default async function PendingInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const user = await requireUser();
  const { cursor } = await searchParams;
  const { rounds, nextCursor } = await getReceivedPendingRoundsPageForUser(user.id, {
    take: PAGE_SIZE,
    cursor: cursor ?? null,
  });

  const pendingCount = rounds.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/rounds">
            <ArrowLeft className="mr-1 h-4 w-4" /> Rounds
          </Link>
        </Button>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-primary">Inbox</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Shared with you
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Scorecards another player tagged you on. Open one to review and accept.
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-400">
              {pendingCount} pending
            </Badge>
          )}
        </div>
      </div>

      {rounds.length === 0 ? (
        <Card className="grid place-items-center p-12 text-center">
          <Inbox className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="max-w-md text-sm text-muted-foreground">
            Nothing in your inbox yet. When someone shares a scorecard row with you it'll appear here.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-border/60">
            {rounds.map((round) => (
              <li key={round.id}>
                <PendingRow round={round} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {nextCursor && (
        <div className="flex justify-center">
          <Button asChild variant="outline" size="sm">
            <Link href={`/rounds/pending?cursor=${encodeURIComponent(nextCursor)}`}>
              Load older
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function PendingRow({ round }: { round: PendingRoundSummary }) {
  const over = round.totalStrokes - round.totalPar;
  const isActionable = round.status === "PENDING";
  return (
    <Link
      href={`/rounds/pending/${round.id}`}
      className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-secondary/30 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="font-medium">
          {round.scorecardPlayerName ?? round.scorecardRowLabel ?? "Shared scorecard row"}
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
          <div className="number-mono text-2xl font-semibold">{round.totalStrokes}</div>
          <div className={scoreTone(over)}>
            {over >= 0 ? "+" : ""}
            {over} vs par
          </div>
        </div>
        <StatusBadge status={round.status} action={isActionable ? "Review" : null} />
      </div>
    </Link>
  );
}

function StatusBadge({
  status,
  action,
}: {
  status: PendingRoundSummary["status"];
  action?: string | null;
}) {
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
      {action ?? "Pending"}
    </Badge>
  );
}

function scoreTone(over: number): string {
  return (
    "text-xs " +
    (over <= 0 ? "text-primary" : over < 5 ? "text-amber-400" : "text-destructive")
  );
}
