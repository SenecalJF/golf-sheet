import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireAdminApiUser } from "@/lib/auth-utils";
import { TournamentScoreInputSchema } from "@/lib/types";
import { createOrUpdateTournamentScore } from "../score-mutations";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ editionId: string; scoreId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId, scoreId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = TournamentScoreInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const score = await createOrUpdateTournamentScore({
      editionId,
      scoreId,
      input: parsed.data,
      submittedByUserId: user.id,
    });
    return NextResponse.json(score);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Score save failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ editionId: string; scoreId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId, scoreId } = await params;
  await prisma.tournamentScore.delete({ where: { id: scoreId, editionId } });
  return NextResponse.json({ ok: true });
}
