import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Flag, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeeEditor } from "@/components/courses/tee-editor";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth-utils";
import { getSharedCourseForUser } from "@/lib/data";
import { countedRounds, summarizeScoreFormat, type ScoreFormatSummary } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function CourseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const course = await getSharedCourseForUser(id, user.id);
  if (!course) notFound();

  const totalRounds = course.rounds.length;
  const statsRounds = countedRounds(course.rounds);
  const eighteenHoleStats = summarizeScoreFormat(statsRounds, 18);
  const nineHoleStats = summarizeScoreFormat(statsRounds, 9);

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/courses">
            <ArrowLeft className="mr-1 h-4 w-4" /> Courses
          </Link>
        </Button>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Flag className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">{course.name}</h1>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {course.city}, {course.province}
            </div>
            {course.notes && (
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{course.notes}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 text-right sm:grid-cols-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Rounds</div>
              <div className="number-mono text-2xl font-semibold">{totalRounds}</div>
            </div>
            <CourseHeaderStat label="18H best" stat={eighteenHoleStats} />
            <CourseHeaderStat label="9H best" stat={nineHoleStats} />
          </div>
        </div>
      </div>

      <TeeEditor courseId={course.id} tees={course.tees} canDeleteTees={user.isAdmin} />

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold tracking-tight">
          Your rounds at this course
        </h2>
        {course.rounds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rounds yet at this course.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {course.rounds.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <Link href={`/rounds/${r.id}`} className="hover:text-primary">
                  <div className="font-medium">{format(r.date, "MMM d, yyyy")}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.tee?.name ?? "—"} tees · {r.holeCount} holes
                  </div>
                </Link>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="number-mono text-xl">{r.totalStrokes}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.totalStrokes - r.totalPar >= 0 ? "+" : ""}
                      {r.totalStrokes - r.totalPar} vs par
                    </div>
                  </div>
                  {r.excludeFromStats ? (
                    <Badge variant="outline" className="border-border/60 text-muted-foreground">
                      Casual
                    </Badge>
                  ) : (
                    r.scoreDiff != null && (
                      <Badge variant="outline">Diff {r.scoreDiff.toFixed(1)}</Badge>
                    )
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function CourseHeaderStat({
  label,
  stat,
}: {
  label: string;
  stat: ScoreFormatSummary;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="number-mono text-2xl font-semibold">{stat.best ?? "—"}</div>
      <div className="text-xs text-muted-foreground">
        {stat.rounds === 0
          ? "No rounds"
          : `Avg ${stat.avg ?? "—"} · ${stat.rounds} round${stat.rounds === 1 ? "" : "s"}`}
      </div>
    </div>
  );
}
