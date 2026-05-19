import { prisma } from "@/lib/db";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { requireUser } from "@/lib/auth-utils";
import { getAnthropicKeyStatus } from "@/lib/user-secrets";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const [rounds, courses, keyStatus] = await Promise.all([
    prisma.round.findMany({
      where: { userId: user.id },
      include: {
        course: true,
        tee: true,
        holes: { orderBy: { holeNumber: "asc" } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.course.findMany({ orderBy: { name: "asc" } }),
    getAnthropicKeyStatus(user.id),
  ]);
  return <AnalyticsView rounds={rounds} courses={courses} aiEnabled={keyStatus.configured} />;
}
