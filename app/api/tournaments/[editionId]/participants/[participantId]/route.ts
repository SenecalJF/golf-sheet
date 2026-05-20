import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireAdminApiUser } from "@/lib/auth-utils";
import { TournamentParticipantInputSchema } from "@/lib/types";
import { slugifyTournamentValue } from "@/lib/tournaments";
import { getParticipantUserLinkError } from "../user-linking";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ editionId: string; participantId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId, participantId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = TournamentParticipantInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const linkError = await getParticipantUserLinkError({
    editionId,
    participantId,
    userId: data.userId,
  });
  if (linkError) return NextResponse.json({ error: linkError }, { status: 409 });

  const participant = await prisma.$transaction(async (tx) => {
    const updated = await tx.tournamentParticipant.update({
      where: { id: participantId, editionId },
      data: {
        userId: data.userId,
        displayName: data.displayName,
        slug:
          data.slug === undefined
            ? undefined
            : slugifyTournamentValue(data.slug || data.displayName || ""),
        nickname: data.nickname,
        country: data.country,
        bio: data.bio,
        role: data.role,
        image: data.image,
        handicapSnapshot: data.handicapSnapshot,
        courseHandicapSnapshot: data.courseHandicapSnapshot,
        individualWins: data.individualWins,
        teamWins: data.teamWins,
        displayOrder: data.displayOrder,
      },
    });

    if (data.role === "CADDIE") {
      await tx.tournamentTeamMember.deleteMany({ where: { participantId } });
    }

    return updated;
  });
  return NextResponse.json(participant);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ editionId: string; participantId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId, participantId } = await params;
  await prisma.tournamentParticipant.delete({ where: { id: participantId, editionId } });
  return NextResponse.json({ ok: true });
}
