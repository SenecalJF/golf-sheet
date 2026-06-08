import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PendingRoundReviewForm,
  type ReviewablePendingRound,
} from "@/components/rounds/pending-round-review-form";
import { requireUser } from "@/lib/auth-utils";
import { getCoursesForNewRound, getPendingRoundForRecipient } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PendingRoundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const [pending, courses] = await Promise.all([
    getPendingRoundForRecipient(id, user.id),
    getCoursesForNewRound(user.id),
  ]);
  if (!pending) notFound();

  const playerName =
    pending.scorecardPlayerName ?? pending.scorecardRowLabel ?? "shared player row";

  if (pending.status !== "PENDING") {
    const accepted = pending.status === "ACCEPTED";
    return (
      <div className="space-y-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/rounds">
            <ArrowLeft className="mr-1 h-4 w-4" /> Rounds
          </Link>
        </Button>
        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge
                variant="outline"
                className={
                  accepted
                    ? "border-primary/40 text-primary"
                    : "border-destructive/40 text-destructive"
                }
              >
                {accepted ? "Accepted" : "Rejected"}
              </Badge>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                This pending round is closed
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {playerName} from {pending.sender.name} ·{" "}
                {format(pending.date, "MMM d, yyyy")}
              </p>
            </div>
            {accepted && pending.acceptedRoundId ? (
              <Button asChild>
                <Link href={`/rounds/${pending.acceptedRoundId}`}>
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  View round
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/rounds">
                  <XCircle className="mr-1 h-4 w-4" />
                  Back to rounds
                </Link>
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const reviewable: ReviewablePendingRound = {
    id: pending.id,
    senderName: pending.sender.name,
    courseId: pending.courseId,
    teeId: pending.teeId,
    date: pending.date.toISOString().slice(0, 10),
    holeCount: pending.holeCount === 9 ? 9 : 18,
    nineType:
      pending.nineType === "front" || pending.nineType === "back" ? pending.nineType : null,
    notes: pending.notes,
    weather: pending.weather,
    pcc: pending.pcc,
    sourceImage: pending.sourceImage,
    extractionModel: pending.extractionModel,
    excludeFromStats: pending.excludeFromStats,
    scorecardPlayerName: pending.scorecardPlayerName,
    scorecardRowLabel: pending.scorecardRowLabel,
    rowConfidence: pending.rowConfidence,
    rowNotes: pending.rowNotes,
    holes: pending.holes.map((hole) => ({
      holeNumber: hole.holeNumber,
      par: hole.par,
      strokes: hole.strokes,
      putts: hole.putts ?? null,
      confidence: hole.confidence ?? null,
      illegible: hole.illegible,
    })),
  };

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/rounds">
            <ArrowLeft className="mr-1 h-4 w-4" /> Rounds
          </Link>
        </Button>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-primary">
              Pending round
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Review shared score
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {playerName} from {pending.sender.name} ·{" "}
              {format(pending.date, "MMM d, yyyy")}
            </p>
          </div>
          <Badge variant="outline" className="border-warning/40 text-warning">
            <Clock className="mr-1 h-3 w-3" />
            Waiting for you
          </Badge>
        </div>
      </div>

      <PendingRoundReviewForm pending={reviewable} courses={courses} />
    </div>
  );
}
