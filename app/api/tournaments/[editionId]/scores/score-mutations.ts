import type { Prisma, TournamentScoreSource } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { TournamentScoreInput, TournamentScoreHoleInput } from "@/lib/types";
import { parseNullableDate } from "@/lib/tournaments";

type ScorePayload = {
  data: Prisma.TournamentScoreUncheckedCreateInput;
  holes: TournamentScoreHoleInput[];
};

export async function createOrUpdateTournamentScore({
  editionId,
  input,
  scoreId,
  submittedByUserId,
}: {
  editionId: string;
  input: TournamentScoreInput;
  scoreId?: string;
  submittedByUserId: string;
}) {
  const payload = await buildScorePayload(editionId, input, submittedByUserId);

  return prisma.$transaction(async (tx) => {
    const existingScore = scoreId
      ? await tx.tournamentScore.findFirst({
          where: { id: scoreId, editionId },
          select: { id: true },
        })
      : payload.data.editionCourseId
        ? await tx.tournamentScore.findUnique({
            where: {
              editionCourseId_participantId: {
                editionCourseId: payload.data.editionCourseId,
                participantId: payload.data.participantId,
              },
            },
            select: { id: true },
          })
        : null;

    const score = existingScore
      ? await tx.tournamentScore.update({
          where: { id: existingScore.id },
          data: payload.data,
        })
      : await tx.tournamentScore.create({ data: payload.data });

    await tx.tournamentScoreHole.deleteMany({ where: { scoreId: score.id } });
    if (payload.holes.length > 0) {
      await tx.tournamentScoreHole.createMany({
        data: payload.holes.map((hole) => ({
          scoreId: score.id,
          holeNumber: hole.holeNumber,
          par: hole.par,
          strokes: hole.strokes,
          putts: hole.putts ?? null,
        })),
      });
    }

    return tx.tournamentScore.findUnique({
      where: { id: score.id },
      include: {
        participant: true,
        editionCourse: { include: { course: true, tee: true } },
        round: { include: { course: true, tee: true } },
        holes: { orderBy: { holeNumber: "asc" } },
      },
    });
  });
}

async function buildScorePayload(
  editionId: string,
  input: TournamentScoreInput,
  submittedByUserId: string,
): Promise<ScorePayload> {
  const participant = await prisma.tournamentParticipant.findFirst({
    where: { id: input.participantId, editionId },
    select: {
      id: true,
      userId: true,
      handicapSnapshot: true,
      courseHandicapSnapshot: true,
    },
  });
  if (!participant) throw new Error("Participant not found");

  const editionCourseId = input.editionCourseId ?? null;
  if (editionCourseId) {
    const editionCourse = await prisma.tournamentEditionCourse.findFirst({
      where: { id: editionCourseId, editionId },
      select: { id: true },
    });
    if (!editionCourse) throw new Error("Tournament course not found");
  }

  let grossStrokes = input.grossStrokes ?? null;
  let totalPar = input.totalPar ?? null;
  let playedAt = parseNullableDate(input.playedAt);
  let holes = input.holes ?? [];
  let source: TournamentScoreSource = "MANUAL";
  const roundId = input.roundId ?? null;

  if (roundId) {
    if (!participant.userId) throw new Error("Guest participants cannot link personal rounds");
    const round = await prisma.round.findFirst({
      where: { id: roundId, userId: participant.userId },
      include: { holes: { orderBy: { holeNumber: "asc" } } },
    });
    if (!round) throw new Error("Linked round was not found for this participant");
    grossStrokes = round.totalStrokes;
    totalPar = round.totalPar;
    playedAt = round.date;
    source = "LINKED_ROUND";
    holes = round.holes.map((hole) => ({
      holeNumber: hole.holeNumber,
      par: hole.par,
      strokes: hole.strokes,
      putts: hole.putts,
    }));
  } else if (holes.length > 0) {
    grossStrokes = holes.reduce((total, hole) => total + hole.strokes, 0);
    totalPar = holes.reduce((total, hole) => total + hole.par, 0);
  }

  if (grossStrokes == null || totalPar == null) {
    throw new Error("Scores need either a linked round, hole scores, or gross/par totals");
  }

  const handicapSnapshot = input.handicapSnapshot ?? participant.handicapSnapshot ?? null;
  const courseHandicapSnapshot =
    input.courseHandicapSnapshot ?? participant.courseHandicapSnapshot ?? null;
  const netStrokes =
    input.netStrokes ?? grossStrokes - (courseHandicapSnapshot ?? 0);

  return {
    data: {
      editionId,
      editionCourseId,
      participantId: participant.id,
      roundId,
      submittedByUserId,
      status: "FINAL",
      source,
      playedAt,
      grossStrokes,
      totalPar,
      handicapSnapshot,
      courseHandicapSnapshot,
      netStrokes,
      notes: input.notes ?? null,
    },
    holes,
  };
}
