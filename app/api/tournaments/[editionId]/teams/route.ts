import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireAdminApiUser } from "@/lib/auth-utils";
import { TournamentTeamInputSchema } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ editionId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = TournamentTeamInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const team = await prisma.$transaction(async (tx) => {
    const created = await tx.tournamentTeam.create({
      data: {
        editionId,
        name: data.name,
        description: data.description ?? null,
        logoImage: data.logoImage ?? null,
        logoAlt: data.logoAlt ?? null,
        displayOrder: data.displayOrder,
      },
    });
    await replaceTeamMembers(tx, editionId, created.id, data.participantIds);
    return tx.tournamentTeam.findUnique({
      where: { id: created.id },
      include: { members: { include: { participant: true }, orderBy: { displayOrder: "asc" } } },
    });
  });

  return NextResponse.json(team, { status: 201 });
}

async function replaceTeamMembers(
  tx: PrismaTransaction,
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

type PrismaTransaction = Prisma.TransactionClient;
