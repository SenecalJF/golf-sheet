import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireAdminApiUser } from "@/lib/auth-utils";
import { TournamentParticipantInputSchema } from "@/lib/types";
import { slugifyTournamentValue } from "@/lib/tournaments";
import { getParticipantUserLinkError } from "./user-linking";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ editionId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = TournamentParticipantInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const slug = slugifyTournamentValue(data.slug || data.displayName);
  if (!slug) return NextResponse.json({ error: "Invalid participant slug" }, { status: 400 });

  const linkError = await getParticipantUserLinkError({
    editionId,
    userId: data.userId,
  });
  if (linkError) return NextResponse.json({ error: linkError }, { status: 409 });

  const participant = await prisma.tournamentParticipant.create({
    data: {
      editionId,
      userId: data.userId ?? null,
      displayName: data.displayName,
      slug,
      nickname: data.nickname ?? null,
      country: data.country ?? null,
      bio: data.bio ?? null,
      role: data.role,
      image: data.image ?? null,
      handicapSnapshot: data.handicapSnapshot ?? null,
      courseHandicapSnapshot: data.courseHandicapSnapshot ?? null,
      individualWins: data.individualWins,
      teamWins: data.teamWins,
      displayOrder: data.displayOrder,
    },
  });

  return NextResponse.json(participant, { status: 201 });
}
