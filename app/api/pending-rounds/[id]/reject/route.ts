import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireApiUser } from "@/lib/auth-utils";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const { id } = await params;
  const updated = await prisma.pendingRound.updateMany({
    where: { id, recipientUserId: user.id, status: "PENDING" },
    data: { status: "REJECTED", actedAt: new Date() },
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
