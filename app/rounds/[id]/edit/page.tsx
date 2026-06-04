import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoundEditForm } from "@/components/rounds/round-edit-form";
import { requireUser } from "@/lib/auth-utils";
import { getCoursesForNewRound, getRoundForUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EditRoundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const [round, courses] = await Promise.all([
    getRoundForUser(id, user.id),
    getCoursesForNewRound(user.id),
  ]);
  if (!round) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/rounds/${round.id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Round
          </Link>
        </Button>
        <div className="mt-2">
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Edit round</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {round.course.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update the round details, hole scores, tee, and notes.
          </p>
        </div>
      </div>

      <RoundEditForm
        courses={courses}
        round={{
          id: round.id,
          courseId: round.courseId,
          teeId: round.teeId,
          date: round.date.toISOString().slice(0, 10),
          holeCount: round.holeCount === 9 ? 9 : 18,
          nineType:
            round.nineType === "front" || round.nineType === "back"
              ? round.nineType
              : null,
          notes: round.notes,
          weather: round.weather,
          pcc: round.pcc,
          sourceImage: round.sourceImage,
          extractionModel: round.extractionModel,
          excludeFromStats: round.excludeFromStats,
          holes: round.holes.map((hole) => ({
            holeNumber: hole.holeNumber,
            par: hole.par,
            strokes: hole.strokes,
            putts: hole.putts ?? null,
            confidence: hole.confidence ?? null,
            illegible: hole.illegible,
          })),
        }}
      />
    </div>
  );
}
