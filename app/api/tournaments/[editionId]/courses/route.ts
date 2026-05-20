import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireAdminApiUser } from "@/lib/auth-utils";
import { TournamentEditionCourseInputSchema } from "@/lib/types";
import { parseNullableDate } from "@/lib/tournaments";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ editionId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = TournamentEditionCourseInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const error = await validateCourseAndTee(parsed.data.courseId, parsed.data.teeId ?? null);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const data = parsed.data;
  const entry = await prisma.tournamentEditionCourse.create({
    data: {
      editionId,
      courseId: data.courseId,
      teeId: data.teeId ?? null,
      roundNumber: data.roundNumber,
      dayLabel: data.dayLabel ?? null,
      teeTime: parseNullableDate(data.teeTime),
      holeCount: data.holeCount,
      notes: data.notes ?? null,
    },
    include: { course: true, tee: true },
  });
  return NextResponse.json(entry, { status: 201 });
}

async function validateCourseAndTee(courseId: string, teeId: string | null) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return "Course not found";
  if (teeId) {
    const tee = await prisma.tee.findFirst({ where: { id: teeId, courseId } });
    if (!tee) return "Selected tee does not belong to course";
  }
  return null;
}
