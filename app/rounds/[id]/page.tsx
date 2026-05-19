import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HoleScoreGrid } from "@/components/rounds/hole-score-grid";
import { RoundDeleteButton } from "@/components/rounds/round-delete-button";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth-utils";
import { getRoundForUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function RoundDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const r = await getRoundForUser(id, user.id);
  if (!r) notFound();
  const over = r.totalStrokes - r.totalPar;

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
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">{r.course.name}</h1>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {r.course.city}
              <span>·</span>
              {format(r.date, "EEE, MMM d, yyyy")}
              <span>·</span>
              {r.holeCount} holes
              {r.tee && (
                <>
                  <span>·</span>
                  {r.tee.name} tees
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div>
              <div className="number-mono text-4xl font-semibold">{r.totalStrokes}</div>
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
                {over} vs par {r.totalPar}
              </div>
            </div>
            {r.scoreDiff != null && (
              <Badge variant="outline" className="border-primary/40 text-primary">
                Differential {r.scoreDiff.toFixed(1)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {r.sourceImage && (
        <Card className="p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={r.sourceImage}
            alt="Scorecard"
            className="mx-auto max-h-[480px] rounded-lg object-contain"
          />
        </Card>
      )}

      <Card className="p-6">
        <HoleScoreGrid
          readOnly
          showConfidence={false}
          holes={r.holes.map((h) => ({
            holeNumber: h.holeNumber,
            par: h.par,
            strokes: h.strokes,
            putts: h.putts ?? null,
            confidence: h.confidence ?? null,
            illegible: h.illegible,
          }))}
        />
      </Card>

      {r.notes && (
        <Card className="p-6">
          <h2 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Notes</h2>
          <p className="text-sm">{r.notes}</p>
        </Card>
      )}

      <div className="flex justify-end">
        <RoundDeleteButton id={r.id} />
      </div>
    </div>
  );
}
