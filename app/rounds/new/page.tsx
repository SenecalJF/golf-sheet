import { prisma } from "@/lib/db";
import { NewRoundFlow } from "@/components/rounds/new-round-flow";
import { hasApiKey } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export default async function NewRoundPage() {
  const courses = await prisma.course.findMany({
    include: { tees: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
  return <NewRoundFlow courses={courses} aiEnabled={hasApiKey()} />;
}
