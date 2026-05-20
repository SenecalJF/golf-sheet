import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireAdminApiUser } from "@/lib/auth-utils";
import { TournamentScheduleItemInputSchema } from "@/lib/types";
import { parseNullableDate } from "@/lib/tournaments";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ editionId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = TournamentScheduleItemInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const item = await prisma.tournamentScheduleItem.create({
    data: {
      editionId,
      dayLabel: data.dayLabel,
      startsAt: parseNullableDate(data.startsAt),
      timeLabel: data.timeLabel ?? null,
      title: data.title,
      details: data.details ?? null,
      displayOrder: data.displayOrder,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
