import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TeeDeleteInputSchema, TeeInputSchema } from "@/lib/types";
import { isAuthResponse, requireApiUser } from "@/lib/auth-utils";
import { summarizeRoundScore } from "@/lib/round-scoring";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const { id } = await params;
  const body = await req.json();
  const parsed = TeeInputSchema.safeParse({ ...body, courseId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const created = await prisma.tee.create({
      data: {
        courseId: id,
        name: parsed.data.name,
        color: parsed.data.color ?? null,
        rating: parsed.data.rating ?? null,
        slope: parsed.data.slope ?? null,
        yardage: parsed.data.yardage ?? null,
        pars: parsed.data.pars,
        holeCount: parsed.data.holeCount,
        rating9F: parsed.data.rating9F ?? null,
        slope9F: parsed.data.slope9F ?? null,
        rating9B: parsed.data.rating9B ?? null,
        slope9B: parsed.data.slope9B ?? null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create tee";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const { id: courseId } = await params;
  const body = await req.json();
  const { teeId, ...rest } = body;
  if (!teeId) return NextResponse.json({ error: "teeId required" }, { status: 400 });
  const parsed = TeeInputSchema.partial().safeParse({ ...rest, courseId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Snapshot the differential-affecting fields BEFORE the update so we know
      // whether any existing rounds need their cached scoreDiff recomputed.
      const before = await tx.tee.findUnique({
        where: { id: teeId },
        select: {
          rating: true,
          slope: true,
          rating9F: true,
          slope9F: true,
          rating9B: true,
          slope9B: true,
        },
      });
      if (!before) {
        throw new TeeNotFoundError();
      }

      const updated = await tx.tee.update({
        where: { id: teeId },
        data: {
          name: data.name,
          color: data.color,
          rating: data.rating,
          slope: data.slope,
          yardage: data.yardage,
          pars: data.pars,
          holeCount: data.holeCount,
          rating9F: data.rating9F,
          slope9F: data.slope9F,
          rating9B: data.rating9B,
          slope9B: data.slope9B,
        },
      });

      // Only rating / slope (full + per-9) feed into computeScoreDifferential.
      // Tee.pars doesn't matter here — each round stores its own per-hole par
      // on HoleScore at save time, so prior rounds keep their pars even if the
      // tee's pars string changes.
      const ratingChanged =
        (data.rating !== undefined && data.rating !== before.rating) ||
        (data.slope !== undefined && data.slope !== before.slope) ||
        (data.rating9F !== undefined && data.rating9F !== before.rating9F) ||
        (data.slope9F !== undefined && data.slope9F !== before.slope9F) ||
        (data.rating9B !== undefined && data.rating9B !== before.rating9B) ||
        (data.slope9B !== undefined && data.slope9B !== before.slope9B);

      let recomputed = 0;
      if (ratingChanged) {
        const rounds = await tx.round.findMany({
          where: { teeId },
          include: { holes: { orderBy: { holeNumber: "asc" } } },
        });

        for (const round of rounds) {
          const summary = summarizeRoundScore(
            {
              date: round.date,
              holeCount: round.holeCount as 9 | 18,
              nineType: (round.nineType ?? null) as "front" | "back" | null,
              pcc: round.pcc,
              holes: round.holes.map((h) => ({
                holeNumber: h.holeNumber,
                par: h.par,
                strokes: h.strokes,
                putts: h.putts,
                confidence: h.confidence,
                illegible: h.illegible,
              })),
            },
            updated,
            round.id,
          );
          if (summary.scoreDiff !== round.scoreDiff) {
            await tx.round.update({
              where: { id: round.id },
              data: { scoreDiff: summary.scoreDiff },
            });
            recomputed += 1;
          }
        }
      }

      return { updated, recomputed };
    });

    return NextResponse.json({
      ...result.updated,
      scoreDiffsRecomputed: result.recomputed,
    });
  } catch (e: unknown) {
    if (e instanceof TeeNotFoundError) {
      return NextResponse.json({ error: "Tee not found" }, { status: 404 });
    }
    const msg = e instanceof Error ? e.message : "Failed to update tee";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

class TeeNotFoundError extends Error {
  constructor() {
    super("Tee not found");
    this.name = "TeeNotFoundError";
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: courseId } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = TeeDeleteInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const deleted = await prisma.tee.deleteMany({
    where: { id: parsed.data.teeId, courseId },
  });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Tee not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
