import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const round = await prisma.round.findUnique({
    where: { id },
    include: { course: true, tee: true, holes: { orderBy: { holeNumber: "asc" } } },
  });
  if (!round) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(round);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.round.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
