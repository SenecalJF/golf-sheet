import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Flag, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeeEditor } from "@/components/courses/tee-editor";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function CourseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      tees: { orderBy: { name: "asc" } },
      rounds: {
        include: { tee: true, holes: { orderBy: { holeNumber: "asc" } } },
        orderBy: { date: "desc" },
      },
    },
  });
  if (!course) notFound();

  const totalRounds = course.rounds.length;
  const totals = course.rounds.map((r) => r.totalStrokes);
  const best = totals.length ? Math.min(...totals) : null;
  const avg = totals.length
    ? Math.round((totals.reduce((s, x) => s + x, 0) / totals.length) * 10) / 10
    : null;

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
          <div className="grid grid-cols-3 gap-3 text-right">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Rounds</div>
              <div className="number-mono text-2xl font-semibold">{totalRounds}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Best</div>
              <div className="number-mono text-2xl font-semibold">{best ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Avg</div>
              <div className="number-mono text-2xl font-semibold">{avg ?? "—"}</div>
            </div>
          </div>
        </div>
      </div>

      <TeeEditor courseId={course.id} tees={course.tees} />

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold tracking-tight">Rounds at this course</h2>
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
                  {r.scoreDiff != null && (
                    <Badge variant="outline">Diff {r.scoreDiff.toFixed(1)}</Badge>
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
