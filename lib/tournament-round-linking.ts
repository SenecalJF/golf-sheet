import "server-only";

import type { Prisma } from "@prisma/client";
import { getTournamentScoreSubmissionState } from "@/lib/tournament-submissions";

export class TournamentRoundLinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TournamentRoundLinkError";
  }
}

type LinkedRoundHole = {
  holeNumber: number;
  par: number;
  strokes: number;
  putts: number | null;
};

type LinkedRound = {
  id: string;
  courseId: string;
  date: Date;
  totalStrokes: number;
  totalPar: number;
  holes: LinkedRoundHole[];
};

export async function createOrUpdateLinkedTournamentScore(
  tx: Prisma.TransactionClient,
  {
    editionId,
    editionCourseId,
    round,
    userId,
  }: {
    editionId: string;
    editionCourseId: string | null | undefined;
    round: LinkedRound;
    userId: string;
  },
) {
  const [edition, participant] = await Promise.all([
    tx.tournamentEdition.findUnique({
      where: { id: editionId },
      select: {
        year: true,
        config: true,
        series: { select: { slug: true } },
      },
    }),
    tx.tournamentParticipant.findFirst({
      where: {
        editionId,
        userId,
        role: { not: "CADDIE" },
      },
      select: {
        id: true,
        handicapSnapshot: true,
        courseHandicapSnapshot: true,
      },
    }),
  ]);
  if (!edition) {
    throw new TournamentRoundLinkError("Tournament edition was not found.");
  }

  const submissionState = getTournamentScoreSubmissionState({
    seriesSlug: edition.series.slug,
    year: edition.year,
    config: edition.config,
  });
  if (!submissionState.isOpen) {
    throw new TournamentRoundLinkError(
      `Tournament score submission opens ${submissionState.opensAtLabel}.`,
    );
  }

  if (!participant) {
    throw new TournamentRoundLinkError("You are not linked to a player in this tournament.");
  }

  const tournamentCourse = editionCourseId
    ? await tx.tournamentEditionCourse.findFirst({
        where: { id: editionCourseId, editionId },
        select: { id: true, courseId: true },
      })
    : await tx.tournamentEditionCourse.findFirst({
        where: { editionId, courseId: round.courseId },
        select: { id: true, courseId: true },
        orderBy: { roundNumber: "asc" },
      });

  if (!tournamentCourse) {
    throw new TournamentRoundLinkError("This tournament course was not found.");
  }
  if (tournamentCourse.courseId !== round.courseId) {
    throw new TournamentRoundLinkError(
      "The selected round course does not match the tournament course.",
    );
  }

  const [existingByRound, existingByCourseParticipant] = await Promise.all([
    tx.tournamentScore.findUnique({
      where: { roundId: round.id },
      select: { id: true, editionId: true, participantId: true },
    }),
    tx.tournamentScore.findUnique({
      where: {
        editionCourseId_participantId: {
          editionCourseId: tournamentCourse.id,
          participantId: participant.id,
        },
      },
      select: { id: true, roundId: true },
    }),
  ]);

  if (
    existingByRound &&
    (existingByRound.editionId !== editionId ||
      existingByRound.participantId !== participant.id)
  ) {
    throw new TournamentRoundLinkError("This round is already linked to another tournament score.");
  }
  if (
    existingByRound &&
    existingByCourseParticipant &&
    existingByRound.id !== existingByCourseParticipant.id
  ) {
    throw new TournamentRoundLinkError(
      "This tournament round already has a different linked score.",
    );
  }

  const courseHandicapSnapshot = participant.courseHandicapSnapshot ?? null;
  const scoreData = {
    editionId,
    editionCourseId: tournamentCourse.id,
    participantId: participant.id,
    roundId: round.id,
    submittedByUserId: userId,
    status: "FINAL" as const,
    source: "LINKED_ROUND" as const,
    playedAt: round.date,
    grossStrokes: round.totalStrokes,
    totalPar: round.totalPar,
    handicapSnapshot: participant.handicapSnapshot ?? null,
    courseHandicapSnapshot,
    netStrokes: round.totalStrokes - (courseHandicapSnapshot ?? 0),
    notes: null,
  };

  const existingScoreId = existingByCourseParticipant?.id ?? existingByRound?.id ?? null;
  const score = existingScoreId
    ? await tx.tournamentScore.update({
        where: { id: existingScoreId },
        data: scoreData,
      })
    : await tx.tournamentScore.create({ data: scoreData });

  await tx.tournamentScoreHole.deleteMany({ where: { scoreId: score.id } });
  await tx.tournamentScoreHole.createMany({
    data: [...round.holes]
      .sort((a, b) => a.holeNumber - b.holeNumber)
      .map((hole) => ({
        scoreId: score.id,
        holeNumber: hole.holeNumber,
        par: hole.par,
        strokes: hole.strokes,
        putts: hole.putts,
      })),
  });
}
