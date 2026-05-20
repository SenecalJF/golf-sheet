import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireAdminApiUser } from "@/lib/auth-utils";
import { TournamentEditionCourseInputSchema } from "@/lib/types";
import { parseNullableDate } from "@/lib/tournaments";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ editionId: string; courseEntryId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId, courseEntryId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = TournamentEditionCourseInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  if (data.courseId) {
    const error = await validateCourseAndTee(data.courseId, data.teeId ?? null);
    if (error) return NextResponse.json({ error }, { status: 400 });
  }
  const entry = await prisma.tournamentEditionCourse.update({
    where: { id: courseEntryId, editionId },
    data: {
      courseId: data.courseId,
      teeId: data.teeId,
      roundNumber: data.roundNumber,
      dayLabel: data.dayLabel,
      teeTime: data.teeTime === undefined ? undefined : parseNullableDate(data.teeTime),
      holeCount: data.holeCount,
      notes: data.notes,
    },
    include: { course: true, tee: true },
  });
  return NextResponse.json(entry);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ editionId: string; courseEntryId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId, courseEntryId } = await params;
  await prisma.tournamentEditionCourse.delete({ where: { id: courseEntryId, editionId } });
  return NextResponse.json({ ok: true });
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
