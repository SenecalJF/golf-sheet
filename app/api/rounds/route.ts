import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { RoundCreateInputSchema } from "@/lib/types";
import { holeCreateRows, summarizeRoundScore, validateRoundHoles } from "@/lib/round-scoring";
import { isAuthResponse, requireApiUser } from "@/lib/auth-utils";

export async function GET() {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const rounds = await prisma.round.findMany({
    where: { userId: user.id },
    include: {
      course: true,
      tee: true,
      holes: { orderBy: { holeNumber: "asc" } },
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(rounds);
}

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const body = await req.json();
  const parsed = RoundCreateInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const holeError = validateRoundHoles(d);
  if (holeError) {
    return NextResponse.json({ error: holeError }, { status: 400 });
  }

  for (const assignment of d.pendingAssignments ?? []) {
    const assignmentHoleError = validateRoundHoles({
      holeCount: d.holeCount,
      holes: assignment.holes,
    });
    if (assignmentHoleError) {
      return NextResponse.json({ error: assignmentHoleError }, { status: 400 });
    }
  }

  const duplicateRecipients = new Set<string>();
  for (const assignment of d.pendingAssignments ?? []) {
    if (assignment.recipientUserId === user.id) {
      return NextResponse.json(
        { error: "Cannot send a pending round to yourself" },
        { status: 400 },
      );
    }
    if (duplicateRecipients.has(assignment.recipientUserId)) {
      return NextResponse.json(
        { error: "Each recipient can only receive one row from this scorecard" },
        { status: 400 },
      );
    }
    duplicateRecipients.add(assignment.recipientUserId);
  }

  const [course, tee, recipients] = await Promise.all([
    prisma.course.findUnique({ where: { id: d.courseId }, select: { id: true } }),
    d.teeId ? prisma.tee.findUnique({ where: { id: d.teeId } }) : null,
    d.pendingAssignments?.length
      ? prisma.user.findMany({
          where: { id: { in: [...duplicateRecipients] } },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 400 });
  if (d.teeId && (!tee || tee.courseId !== d.courseId)) {
    return NextResponse.json(
      { error: "Selected tee does not belong to that course" },
      { status: 400 },
    );
  }
  if (recipients.length !== duplicateRecipients.size) {
    return NextResponse.json({ error: "One recipient was not found" }, { status: 400 });
  }

  const date = new Date(d.date);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid round date" }, { status: 400 });
  }
  const summary = summarizeRoundScore(d, tee);

  const round = await prisma.$transaction(async (tx) => {
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

    for (const assignment of d.pendingAssignments ?? []) {
      const assignmentSummary = summarizeRoundScore(
        { ...d, holes: assignment.holes },
        tee,
        "pending",
      );
      await tx.pendingRound.create({
        data: {
          senderUserId: user.id,
          recipientUserId: assignment.recipientUserId,
          courseId: d.courseId,
          teeId: d.teeId ?? null,
          date,
          holeCount: d.holeCount,
          nineType: d.holeCount === 9 ? d.nineType ?? null : null,
          notes: d.notes ?? null,
          weather: d.weather ?? null,
          pcc: d.pcc,
          totalStrokes: assignmentSummary.totalStrokes,
          totalPar: assignmentSummary.totalPar,
          scoreDiff: assignmentSummary.scoreDiff,
          sourceImage: d.sourceImage ?? null,
          extractionModel: d.extractionModel ?? null,
          scorecardPlayerName: assignment.scorecardPlayerName ?? null,
          scorecardRowLabel: assignment.scorecardRowLabel ?? null,
          rowConfidence: assignment.rowConfidence ?? null,
          rowNotes: assignment.rowNotes ?? null,
          holes: { create: holeCreateRows(assignment.holes) },
        },
      });
    }

    return createdRound;
  });

  return NextResponse.json(round, { status: 201 });
}
