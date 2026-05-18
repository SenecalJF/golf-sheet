import { prisma } from "@/lib/db";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { hasApiKey } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [rounds, courses] = await Promise.all([
    prisma.round.findMany({
      include: {
        course: true,
        tee: true,
        holes: { orderBy: { holeNumber: "asc" } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.course.findMany({ orderBy: { name: "asc" } }),
  ]);
  return <AnalyticsView rounds={rounds} courses={courses} aiEnabled={hasApiKey()} />;
}
