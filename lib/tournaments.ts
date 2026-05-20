import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

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
  rank: number | null;
};

export type TournamentCourseGuide = {
  courseName: string;
  image: string | null;
  mapPrefix: string | null;
  tagline: string | null;
  summary: string | null;
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
      user: { select: { id: true, name: true, image: true } },
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
              user: { select: { id: true, name: true, image: true } },
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
      rank: null,
    };
  });

  return rankRows(rows, (row) => [row.netTotal, row.grossTotal, -row.scoreCount]);
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
