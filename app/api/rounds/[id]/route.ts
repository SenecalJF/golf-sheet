import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
