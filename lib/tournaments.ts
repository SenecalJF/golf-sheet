import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getTournamentScoreSubmissionState } from "@/lib/tournament-submissions";

export const TITS_OPEN_SLUG = "tits-open";

export type TournamentLeaderboardRow = {
  participantId: string;
  displayName: string;
  nickname: string | null;
  image: string | null;
  role: string;
  userId: string | null;
  scoreCount: number;
  grossTotal: number | null;
  netTotal: number | null;
  courseHandicapTotal: number;
  individualWins: number;
  teamWins: number;
  rank: number | null;
};

export type TournamentTeamLeaderboardRow = {
  teamId: string;
  name: string;
  description: string | null;
  logoImage: string | null;
  memberCount: number;
  scoreCount: number;
  grossTotal: number | null;
  netTotal: number | null;
  combinedHandicap: number | null;
  averageHandicap: number | null;
  individualWins: number;
  teamWins: number;
  linkedMemberCount: number;
  linkedRoundCount: number;
  recentAvgVsPar: number | null;
  bestDifferential: number | null;
  rank: number | null;
};

export type TournamentPlayerSignal = {
  participantId: string;
  displayName: string;
  nickname: string | null;
  image: string | null;
  profileHref: string;
  teamName: string | null;
  handicapSnapshot: number | null;
  linkedRoundCount: number;
  recentAvgVsPar: number | null;
  bestDifferential: number | null;
  lastRoundDate: Date | null;
};

export type TournamentCourseGuide = {
  courseName: string;
  image: string | null;
  mapPrefix: string | null;
  tagline: string | null;
  summary: string | null;
};

export type TournamentRoundSubmitContext = {
  editionId: string;
  year: number;
  title: string;
  participantName: string;
  courses: {
    id: string;
    roundNumber: number;
    dayLabel: string | null;
    teeTime: string | null;
    teeTimeLabel: string | null;
    courseId: string;
    courseName: string;
    teeId: string | null;
    teeName: string | null;
    holeCount: 9 | 18;
  }[];
};

export const tournamentEditionInclude = {
  series: {
    include: {
      honors: {
        orderBy: [
          { year: "desc" as const },
          { displayOrder: "asc" as const },
        ],
      },
    },
  },
  courses: {
    include: {
      course: true,
      tee: true,
      scores: {
        include: {
          participant: true,
          holes: { orderBy: { holeNumber: "asc" as const } },
        },
        orderBy: { grossStrokes: "asc" as const },
      },
    },
    orderBy: { roundNumber: "asc" as const },
  },
  participants: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          _count: { select: { rounds: true } },
          rounds: {
            select: {
              id: true,
              date: true,
              holeCount: true,
              totalStrokes: true,
              totalPar: true,
              scoreDiff: true,
            },
            orderBy: { date: "desc" as const },
            take: 20,
          },
        },
      },
      scores: {
        include: {
          editionCourse: { include: { course: true, tee: true } },
          round: { include: { course: true, tee: true } },
          holes: { orderBy: { holeNumber: "asc" as const } },
        },
        orderBy: { playedAt: "asc" as const },
      },
      teamMembers: { include: { team: true } },
    },
    orderBy: { displayOrder: "asc" as const },
  },
  teams: {
    include: {
      members: {
        include: {
          participant: {
            include: {
              scores: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  _count: { select: { rounds: true } },
                  rounds: {
                    select: {
                      id: true,
                      date: true,
                      holeCount: true,
                      totalStrokes: true,
                      totalPar: true,
                      scoreDiff: true,
                    },
                    orderBy: { date: "desc" as const },
                    take: 20,
                  },
                },
              },
            },
          },
        },
        orderBy: { displayOrder: "asc" as const },
      },
    },
    orderBy: { displayOrder: "asc" as const },
  },
  scores: {
    include: {
      participant: true,
      editionCourse: { include: { course: true, tee: true } },
      round: { include: { course: true, tee: true } },
      holes: { orderBy: { holeNumber: "asc" as const } },
    },
    orderBy: [{ playedAt: "asc" as const }, { grossStrokes: "asc" as const }],
  },
  schedule: { orderBy: { displayOrder: "asc" as const } },
  honors: {
    orderBy: [
      { year: "desc" as const },
      { displayOrder: "asc" as const },
    ],
  },
} satisfies Prisma.TournamentEditionInclude;

export type TournamentEditionFull = Prisma.TournamentEditionGetPayload<{
  include: typeof tournamentEditionInclude;
}>;

export async function listTitsOpenEditions() {
  return prisma.tournamentEdition.findMany({
    where: { series: { slug: TITS_OPEN_SLUG } },
    include: {
      series: true,
      _count: { select: { participants: true, scores: true } },
    },
    orderBy: { year: "desc" },
  });
}

export async function getCurrentTitsOpenEdition() {
  return prisma.tournamentEdition.findFirst({
    where: { series: { slug: TITS_OPEN_SLUG } },
    include: tournamentEditionInclude,
    orderBy: { year: "desc" },
  });
}

export async function getTitsOpenEditionByYear(year: number) {
  return prisma.tournamentEdition.findFirst({
    where: { year, series: { slug: TITS_OPEN_SLUG } },
    include: tournamentEditionInclude,
  });
}

export async function getTournamentRoundSubmitContext(
  editionId: string,
  userId: string,
): Promise<TournamentRoundSubmitContext | null> {
  const edition = await prisma.tournamentEdition.findFirst({
    where: { id: editionId, series: { slug: TITS_OPEN_SLUG } },
    select: {
      id: true,
      year: true,
      title: true,
      config: true,
      series: { select: { slug: true } },
      courses: {
        include: {
          course: { select: { id: true, name: true } },
          tee: { select: { id: true, name: true } },
        },
        orderBy: { roundNumber: "asc" },
      },
      participants: {
        where: { userId, role: { not: "CADDIE" } },
        select: { displayName: true },
        take: 1,
      },
      schedule: {
        where: { title: { equals: "Tee off", mode: "insensitive" } },
        select: { dayLabel: true, timeLabel: true },
      },
    },
  });

  const participant = edition?.participants[0];
  if (!edition || !participant) return null;
  const submissionState = getTournamentScoreSubmissionState({
    seriesSlug: edition.series.slug,
    year: edition.year,
    config: edition.config,
  });
  if (!submissionState.isOpen) return null;

  const teeTimesByDay = new Map(
    edition.schedule.map((item) => [item.dayLabel.toLowerCase(), item.timeLabel]),
  );

  return {
    editionId: edition.id,
    year: edition.year,
    title: edition.title,
    participantName: participant.displayName,
    courses: edition.courses.map((entry) => ({
      id: entry.id,
      roundNumber: entry.roundNumber,
      dayLabel: entry.dayLabel,
      teeTime: entry.teeTime?.toISOString() ?? null,
      teeTimeLabel: entry.dayLabel ? teeTimesByDay.get(entry.dayLabel.toLowerCase()) ?? null : null,
      courseId: entry.course.id,
      courseName: entry.course.name,
      teeId: entry.tee?.id ?? null,
      teeName: entry.tee?.name ?? null,
      holeCount: entry.holeCount === 9 ? 9 : 18,
    })),
  };
}

export async function getTournamentAdminOptions(edition: TournamentEditionFull) {
  const linkedUserIds = edition.participants
    .map((participant) => participant.userId)
    .filter((userId): userId is string => Boolean(userId));
  const [users, courses, rounds] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, image: true },
      orderBy: { name: "asc" },
    }),
    prisma.course.findMany({
      include: { tees: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
    linkedUserIds.length > 0
      ? prisma.round.findMany({
          where: { userId: { in: linkedUserIds } },
          include: {
            user: { select: { id: true, name: true } },
            course: true,
            tee: true,
            holes: { orderBy: { holeNumber: "asc" } },
          },
          orderBy: { date: "desc" },
          take: 100,
        })
      : Promise.resolve([]),
  ]);

  return { users, courses, rounds };
}

export function buildParticipantLeaderboard(
  edition: TournamentEditionFull,
): TournamentLeaderboardRow[] {
  const rows = edition.participants
    .filter((participant) => participant.role !== "CADDIE")
    .map((participant) => {
      const finalScores = participant.scores.filter((score) => score.status === "FINAL");
      const grossTotal = sumOrNull(finalScores.map((score) => score.grossStrokes));
      const courseHandicapTotal = finalScores.reduce(
        (total, score) => total + (score.courseHandicapSnapshot ?? 0),
        0,
      );
      const netTotal = sumOrNull(
        finalScores.map(
          (score) => score.netStrokes ?? score.grossStrokes - (score.courseHandicapSnapshot ?? 0),
        ),
      );

      return {
        participantId: participant.id,
        displayName: participant.displayName,
        nickname: participant.nickname,
        image: participant.image,
        role: participant.role,
        userId: participant.userId,
        scoreCount: finalScores.length,
        grossTotal,
        netTotal,
        courseHandicapTotal,
        individualWins: participant.individualWins,
        teamWins: participant.teamWins,
        rank: null,
      };
    });

  return rankRows(rows, (row) => [row.netTotal, row.grossTotal, -row.scoreCount]);
}

export function buildTeamLeaderboard(
  edition: TournamentEditionFull,
): TournamentTeamLeaderboardRow[] {
  const participantRows = new Map(
    buildParticipantLeaderboard(edition).map((row) => [row.participantId, row]),
  );
  const rows = edition.teams.map((team) => {
    const members = team.members
      .map((member) => participantRows.get(member.participantId))
      .filter((member): member is TournamentLeaderboardRow => Boolean(member));
    const participants = team.members
      .map((member) => member.participant)
      .filter((participant) => participant.role !== "CADDIE");
    const handicaps = participants
      .map((participant) => participant.handicapSnapshot)
      .filter((handicap): handicap is number => handicap != null);
    const combinedHandicap =
      participants.length > 0 && handicaps.length === participants.length
        ? roundOne(handicaps.reduce((total, handicap) => total + handicap, 0))
        : null;
    const appRounds = participants.flatMap((participant) => participant.user?.rounds ?? []);
    const recentRounds = [...appRounds]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
    const grossTotal = sumOrNull(members.map((member) => member.grossTotal));
    const netTotal = sumOrNull(members.map((member) => member.netTotal));
    return {
      teamId: team.id,
      name: team.name,
      description: team.description,
      logoImage: team.logoImage,
      memberCount: members.length,
      scoreCount: members.reduce((total, member) => total + member.scoreCount, 0),
      grossTotal,
      netTotal,
      combinedHandicap,
      averageHandicap:
        combinedHandicap == null || participants.length === 0
          ? null
          : roundOne(combinedHandicap / participants.length),
      individualWins: participants.reduce(
        (total, participant) => total + participant.individualWins,
        0,
      ),
      teamWins: participants.reduce((total, participant) => total + participant.teamWins, 0),
      linkedMemberCount: participants.filter((participant) => participant.user).length,
      linkedRoundCount: participants.reduce(
        (total, participant) => total + (participant.user?._count.rounds ?? 0),
        0,
      ),
      recentAvgVsPar: averageOrNull(recentRounds.map(normalizeRoundVsPar)),
      bestDifferential: minOrNull(appRounds.map((round) => round.scoreDiff)),
      rank: null,
    };
  });

  return rankRows(rows, (row) => [row.netTotal, row.grossTotal, -row.scoreCount]);
}

export function buildTournamentPlayerSignals(
  edition: TournamentEditionFull,
): TournamentPlayerSignal[] {
  return edition.participants
    .flatMap((participant) => {
      const linkedUser = participant.user;
      if (participant.role === "CADDIE" || !linkedUser) return [];

      const appRounds = linkedUser.rounds;
      const recentRounds = [...appRounds]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);

      return [
        {
          participantId: participant.id,
          displayName: participant.displayName,
          nickname: participant.nickname,
          image: participant.image ?? linkedUser.image ?? null,
          profileHref: `/players/${linkedUser.id}`,
          teamName: participant.teamMembers[0]?.team.name ?? null,
          handicapSnapshot: participant.handicapSnapshot,
          linkedRoundCount: linkedUser._count.rounds,
          recentAvgVsPar: averageOrNull(recentRounds.map(normalizeRoundVsPar)),
          bestDifferential: minOrNull(appRounds.map((round) => round.scoreDiff)),
          lastRoundDate: appRounds[0]?.date ?? null,
        },
      ];
    })
    .sort(
      (a, b) =>
        nullsLast(a.recentAvgVsPar, b.recentAvgVsPar) ||
        nullsLast(a.bestDifferential, b.bestDifferential) ||
        b.linkedRoundCount - a.linkedRoundCount ||
        a.displayName.localeCompare(b.displayName),
    );
}

export function getTournamentCourseGuides(
  edition: TournamentEditionFull,
): TournamentCourseGuide[] {
  const config = asRecord(edition.config);
  const rawGuides = Array.isArray(config?.courseGuide) ? config.courseGuide : [];
  return rawGuides
    .map((guide) => {
      const item = asRecord(guide);
      if (!item || typeof item.courseName !== "string") return null;
      return {
        courseName: item.courseName,
        image: typeof item.image === "string" ? item.image : null,
        mapPrefix: typeof item.mapPrefix === "string" ? item.mapPrefix : null,
        tagline: typeof item.tagline === "string" ? item.tagline : null,
        summary: typeof item.summary === "string" ? item.summary : null,
      };
    })
    .filter((guide): guide is TournamentCourseGuide => Boolean(guide));
}

export function getEditionConfigText(edition: TournamentEditionFull, key: string) {
  const config = asRecord(edition.config);
  const value = config?.[key];
  return typeof value === "string" ? value : null;
}

export function slugifyTournamentValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseNullableDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function rankRows<T extends { rank: number | null }>(
  rows: T[],
  getValues: (row: T) => [number | null, number | null, number],
) {
  const sorted = [...rows].sort((a, b) => {
    const [aPrimary, aSecondary, aCount] = getValues(a);
    const [bPrimary, bSecondary, bCount] = getValues(b);
    if (aPrimary == null && bPrimary == null) return aCount - bCount;
    if (aPrimary == null) return 1;
    if (bPrimary == null) return -1;
    if (aPrimary !== bPrimary) return aPrimary - bPrimary;
    if (aSecondary == null && bSecondary == null) return aCount - bCount;
    if (aSecondary == null) return 1;
    if (bSecondary == null) return -1;
    if (aSecondary !== bSecondary) return aSecondary - bSecondary;
    return aCount - bCount;
  });

  let lastKey = "";
  let lastRank = 0;
  return sorted.map((row, index) => {
    const [primary, secondary] = getValues(row);
    const key = `${primary ?? "none"}:${secondary ?? "none"}`;
    const rank = primary == null ? null : key === lastKey ? lastRank : index + 1;
    lastKey = key;
    if (rank != null) lastRank = rank;
    return { ...row, rank };
  });
}

function sumOrNull(values: (number | null)[]) {
  const numeric = values.filter((value): value is number => value != null);
  if (numeric.length === 0) return null;
  return numeric.reduce((total, value) => total + value, 0);
}

function averageOrNull(values: number[]) {
  if (values.length === 0) return null;
  return roundOne(values.reduce((total, value) => total + value, 0) / values.length);
}

function minOrNull(values: (number | null)[]) {
  const numeric = values.filter((value): value is number => value != null);
  return numeric.length > 0 ? roundOne(Math.min(...numeric)) : null;
}

function normalizeRoundVsPar(round: {
  holeCount: number;
  totalStrokes: number;
  totalPar: number;
}) {
  const holeCount = round.holeCount > 0 ? round.holeCount : 18;
  return roundOne(((round.totalStrokes - round.totalPar) / holeCount) * 18);
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function nullsLast(a: number | null, b: number | null) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
