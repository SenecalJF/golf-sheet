import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireAdminApiUser } from "@/lib/auth-utils";
import { TournamentScheduleItemInputSchema } from "@/lib/types";
import { parseNullableDate } from "@/lib/tournaments";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ editionId: string; itemId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId, itemId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = TournamentScheduleItemInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const item = await prisma.tournamentScheduleItem.update({
    where: { id: itemId, editionId },
    data: {
      dayLabel: data.dayLabel,
      startsAt: data.startsAt === undefined ? undefined : parseNullableDate(data.startsAt),
      timeLabel: data.timeLabel,
      title: data.title,
      details: data.details,
      displayOrder: data.displayOrder,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ editionId: string; itemId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId, itemId } = await params;
  await prisma.tournamentScheduleItem.delete({ where: { id: itemId, editionId } });
  return NextResponse.json({ ok: true });
}
