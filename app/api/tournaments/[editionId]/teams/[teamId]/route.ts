import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireAdminApiUser } from "@/lib/auth-utils";
import { TournamentTeamInputSchema } from "@/lib/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ editionId: string; teamId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId, teamId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = TournamentTeamInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const team = await prisma.$transaction(async (tx) => {
    await tx.tournamentTeam.update({
      where: { id: teamId, editionId },
      data: {
        name: data.name,
        description: data.description,
        logoImage: data.logoImage,
        logoAlt: data.logoAlt,
        displayOrder: data.displayOrder,
      },
    });
    if (data.participantIds) {
      await replaceTeamMembers(tx, editionId, teamId, data.participantIds);
    }
    return tx.tournamentTeam.findUnique({
      where: { id: teamId },
      include: { members: { include: { participant: true }, orderBy: { displayOrder: "asc" } } },
    });
  });
  return NextResponse.json(team);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ editionId: string; teamId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId, teamId } = await params;
  await prisma.tournamentTeam.delete({ where: { id: teamId, editionId } });
  return NextResponse.json({ ok: true });
}

async function replaceTeamMembers(
  tx: Prisma.TransactionClient,
  editionId: string,
  teamId: string,
  participantIds: string[],
) {
  await tx.tournamentTeamMember.deleteMany({ where: { teamId } });
  if (participantIds.length === 0) return;
  const participants = await tx.tournamentParticipant.findMany({
    where: { id: { in: participantIds }, editionId },
    select: { id: true },
  });
  const validIds = participants.map((participant) => participant.id);
  await tx.tournamentTeamMember.deleteMany({
    where: { participantId: { in: validIds } },
  });
  await tx.tournamentTeamMember.createMany({
    data: validIds.map((participantId, index) => ({
      teamId,
      participantId,
      displayOrder: index + 1,
    })),
  });
}
