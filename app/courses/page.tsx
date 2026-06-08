import { Plus } from "lucide-react";
import { AddCourseDialog } from "@/components/courses/add-course-dialog";
import { CoursesGrid } from "@/components/courses/courses-grid";
import { requireUser } from "@/lib/auth-utils";
import { getSharedCoursesWithUserCounts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const user = await requireUser();
  const courses = await getSharedCoursesWithUserCounts(user.id);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Courses</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {courses.length} courses across Quebec
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sorted by your most-played. Rating + slope are shared; community totals are
            aggregate-only.
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

      <CoursesGrid courses={courses} />
    </div>
  );
}
