import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { RoundInputSchema } from "@/lib/types";
import { computeScoreDifferential } from "@/lib/handicap";
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
  const parsed = RoundInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  // Hole count consistency
  if (d.holes.length !== d.holeCount) {
    return NextResponse.json(
      { error: `Expected ${d.holeCount} holes, got ${d.holes.length}` },
      { status: 400 },
    );
  }

  const totalStrokes = d.holes.reduce((s, h) => s + h.strokes, 0);
  const totalPar = d.holes.reduce((s, h) => s + h.par, 0);

  // Fetch tee for differential
  let scoreDiff: number | null = null;
  if (d.teeId) {
    const tee = await prisma.tee.findUnique({ where: { id: d.teeId } });
    if (tee) {
      scoreDiff = computeScoreDifferential({
        id: "preview",
        date: new Date(d.date),
        holeCount: d.holeCount,
        nineType: d.nineType ?? null,
        totalStrokes,
        pars: d.holes.map((h) => h.par),
        holeStrokes: d.holes.map((h) => h.strokes),
        rating: tee.rating,
        slope: tee.slope,
        rating9F: tee.rating9F,
        slope9F: tee.slope9F,
        rating9B: tee.rating9B,
        slope9B: tee.slope9B,
        pcc: d.pcc,
      });
    }
  }

  const round = await prisma.round.create({
    data: {
      userId: user.id,
      courseId: d.courseId,
      teeId: d.teeId ?? null,
      date: new Date(d.date),
      holeCount: d.holeCount,
      nineType: d.nineType ?? null,
      notes: d.notes ?? null,
      weather: d.weather ?? null,
      pcc: d.pcc,
      totalStrokes,
      totalPar,
      scoreDiff,
      sourceImage: d.sourceImage ?? null,
      extractionModel: d.extractionModel ?? null,
      holes: {
        create: d.holes.map((h) => ({
          holeNumber: h.holeNumber,
          par: h.par,
          strokes: h.strokes,
          putts: h.putts ?? null,
          confidence: h.confidence ?? null,
          illegible: h.illegible ?? false,
        })),
      },
    },
    include: { holes: true, course: true, tee: true },
  });

  return NextResponse.json(round, { status: 201 });
}
