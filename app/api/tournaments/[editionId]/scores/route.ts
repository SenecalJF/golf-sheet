import { NextResponse } from "next/server";
import { isAuthResponse, requireAdminApiUser } from "@/lib/auth-utils";
import { TournamentScoreInputSchema } from "@/lib/types";
import { createOrUpdateTournamentScore } from "./score-mutations";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ editionId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = TournamentScoreInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const score = await createOrUpdateTournamentScore({
      editionId,
      input: parsed.data,
      submittedByUserId: user.id,
    });
    return NextResponse.json(score, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Score save failed" },
      { status: 400 },
    );
  }
}
