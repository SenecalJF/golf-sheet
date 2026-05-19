import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireApiUser } from "@/lib/auth-utils";
import { RoundInputSchema } from "@/lib/types";
import { holeCreateRows, summarizeRoundScore, validateRoundHoles } from "@/lib/round-scoring";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const { id } = await params;
  const body = await req.json();
  const parsed = RoundInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const holeError = validateRoundHoles(d);
  if (holeError) return NextResponse.json({ error: holeError }, { status: 400 });

  const date = new Date(d.date);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid round date" }, { status: 400 });
  }

  const pending = await prisma.pendingRound.findFirst({
    where: { id, recipientUserId: user.id },
    select: { id: true, status: true },
  });
  if (!pending) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (pending.status !== "PENDING") {
    return NextResponse.json({ error: "Pending round is already closed" }, { status: 409 });
  }

  const [course, tee] = await Promise.all([
    prisma.course.findUnique({ where: { id: d.courseId }, select: { id: true } }),
    d.teeId ? prisma.tee.findUnique({ where: { id: d.teeId } }) : null,
  ]);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 400 });
  if (d.teeId && (!tee || tee.courseId !== d.courseId)) {
    return NextResponse.json(
      { error: "Selected tee does not belong to that course" },
      { status: 400 },
    );
  }

  const summary = summarizeRoundScore(d, tee, id);
  let round;
  try {
    round = await prisma.$transaction(async (tx) => {
      const createdRound = await tx.round.create({
        data: {
          userId: user.id,
          courseId: d.courseId,
          teeId: d.teeId ?? null,
          date,
          holeCount: d.holeCount,
          nineType: d.holeCount === 9 ? d.nineType ?? null : null,
          notes: d.notes ?? null,
          weather: d.weather ?? null,
          pcc: d.pcc,
          totalStrokes: summary.totalStrokes,
          totalPar: summary.totalPar,
          scoreDiff: summary.scoreDiff,
          sourceImage: d.sourceImage ?? null,
          extractionModel: d.extractionModel ?? null,
          holes: { create: holeCreateRows(d.holes) },
        },
        include: { holes: true, course: true, tee: true },
      });

      const claimed = await tx.pendingRound.updateMany({
        where: { id, recipientUserId: user.id, status: "PENDING" },
        data: {
          status: "ACCEPTED",
          acceptedRoundId: createdRound.id,
          actedAt: new Date(),
        },
      });
      if (claimed.count === 0) {
        throw new Error("Pending round is already closed");
      }

      return createdRound;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Pending round is already closed") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json(round, { status: 201 });
}
