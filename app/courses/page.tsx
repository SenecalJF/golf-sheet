import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flag, MapPin, Plus, Info } from "lucide-react";
import { prisma } from "@/lib/db";
import { AddCourseDialog } from "@/components/courses/add-course-dialog";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      tees: true,
      _count: { select: { rounds: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Courses</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {courses.length} courses around Montreal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rating + slope are optional — the AI can read them from a scorecard photo when
            you log a round, or you can enter them by hand here.
          </p>
        </div>
        <AddCourseDialog
          trigger={
            <>
              <Plus className="mr-1 h-4 w-4" /> Add course
            </>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => {
          const tee = c.tees[0];
          const needsSetup = !tee || tee.rating == null || tee.slope == null;
          return (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              className="group"
            >
              <Card className="h-full p-5 transition-colors group-hover:border-primary/40">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Flag className="h-5 w-5" />
                  </div>
                  {needsSetup ? (
                    <Badge variant="outline" className="border-border/60 text-muted-foreground">
                      <Info className="mr-1 h-3 w-3" /> No rating yet
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      Handicap-ready
                    </Badge>
                  )}
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight group-hover:text-primary">
                  {c.name}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {c.city}, {c.province}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {c._count.rounds} round{c._count.rounds === 1 ? "" : "s"}
                  </span>
                  <span className="text-muted-foreground">
                    {c.tees.length} tee{c.tees.length === 1 ? "" : "s"}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
