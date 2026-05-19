import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeScoreDifferential } from "@/lib/handicap";
import { RoundInputSchema } from "@/lib/types";
import { isAuthResponse, requireApiUser } from "@/lib/auth-utils";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const { id } = await params;
  const round = await prisma.round.findFirst({
    where: { id, userId: user.id },
    include: { course: true, tee: true, holes: { orderBy: { holeNumber: "asc" } } },
  });
  if (!round) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(round);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const { id } = await params;
  const deleted = await prisma.round.deleteMany({ where: { id, userId: user.id } });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(
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
  if (d.holes.length !== d.holeCount) {
    return NextResponse.json(
      { error: `Expected ${d.holeCount} holes, got ${d.holes.length}` },
      { status: 400 },
    );
  }

  const holeNumbers = new Set(d.holes.map((hole) => hole.holeNumber));
  if (holeNumbers.size !== d.holes.length) {
    return NextResponse.json({ error: "Hole numbers must be unique" }, { status: 400 });
  }

  const date = new Date(d.date);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid round date" }, { status: 400 });
  }

  const existing = await prisma.round.findFirst({
    where: { id, userId: user.id },
    select: { id: true, sourceImage: true, extractionModel: true, weather: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [course, tee] = await Promise.all([
    prisma.course.findUnique({ where: { id: d.courseId }, select: { id: true } }),
    d.teeId
      ? prisma.tee.findUnique({
          where: { id: d.teeId },
          select: {
            id: true,
            courseId: true,
            rating: true,
            slope: true,
            rating9F: true,
            slope9F: true,
            rating9B: true,
            slope9B: true,
          },
        })
      : null,
  ]);

  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 400 });
  if (d.teeId && (!tee || tee.courseId !== d.courseId)) {
    return NextResponse.json(
      { error: "Selected tee does not belong to that course" },
      { status: 400 },
    );
  }

  const totalStrokes = d.holes.reduce((sum, hole) => sum + hole.strokes, 0);
  const totalPar = d.holes.reduce((sum, hole) => sum + hole.par, 0);
  const scoreDiff = tee
    ? computeScoreDifferential({
        id,
        date,
        holeCount: d.holeCount,
        nineType: d.holeCount === 9 ? d.nineType ?? null : null,
        totalStrokes,
        pars: d.holes.map((hole) => hole.par),
        holeStrokes: d.holes.map((hole) => hole.strokes),
        rating: tee.rating,
        slope: tee.slope,
        rating9F: tee.rating9F,
        slope9F: tee.slope9F,
        rating9B: tee.rating9B,
        slope9B: tee.slope9B,
        pcc: d.pcc,
      })
    : null;

  const round = await prisma.round.update({
    where: { id },
    data: {
      courseId: d.courseId,
      teeId: d.teeId ?? null,
      date,
      holeCount: d.holeCount,
      nineType: d.holeCount === 9 ? d.nineType ?? null : null,
      notes: d.notes?.trim() || null,
      weather: d.weather ?? existing.weather,
      pcc: d.pcc,
      totalStrokes,
      totalPar,
      scoreDiff,
      sourceImage: existing.sourceImage,
      extractionModel: existing.extractionModel,
      holes: {
        deleteMany: {},
        create: d.holes.map((hole) => ({
          holeNumber: hole.holeNumber,
          par: hole.par,
          strokes: hole.strokes,
          putts: hole.putts ?? null,
          confidence: hole.confidence ?? null,
          illegible: false,
        })),
      },
    },
    include: { holes: { orderBy: { holeNumber: "asc" } }, course: true, tee: true },
  });

  return NextResponse.json(round);
}
