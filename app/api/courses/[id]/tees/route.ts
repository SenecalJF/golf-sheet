import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TeeDeleteInputSchema, TeeInputSchema } from "@/lib/types";
import { isAuthResponse, requireApiUser } from "@/lib/auth-utils";

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
  const updated = await prisma.tee.update({
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
  return NextResponse.json(updated);
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
