import "server-only";

import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildDifferentialsAndIndex } from "@/lib/handicap";
import {
  frontBackBreakdown,
  summarizeScoreFormat,
  type RoundFull,
  type ScoreFormatSummary,
} from "@/lib/stats";

export type LeaderboardPeriod = "all-time" | "this-year" | "last-5";
export type LeaderboardFormat = "all" | "18" | "9";

export type PlayerLeaderboardStats = {
  rounds: number;
  avgScore: number | null;
  avgVsPar: number | null;
  bestScore: number | null;
  bestDifferential: number | null;
  byFormat: Record<9 | 18, ScoreFormatSummary>;
};

export type PublicPlayerStats = {
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  tournamentIdentities: {
    id: string;
    year: number;
    title: string;
    displayName: string;
    nickname: string | null;
    role: string;
    image: string | null;
    teamName: string | null;
    individualWins: number;
    teamWins: number;
  }[];
  roundsAllTime: number;
  roundsThisYear: number;
  handicapIndex: number | null;
  avgScore: number | null;
  avgVsPar: number | null;
  bestScore: number | null;
  bestDifferential: number | null;
  scoreByFormat: Record<9 | 18, ScoreFormatSummary>;
  leaderboard: Record<LeaderboardPeriod, PlayerLeaderboardStats>;
  recentTrend: {
    recentAvgVsPar: number | null;
    previousAvgVsPar: number | null;
    delta: number | null;
    direction: "better" | "worse" | "flat" | "unknown";
  };
  mostPlayedCourses: {
    courseId: string;
    courseName: string;
    city: string;
    roundsPlayed: number;
    avgScore: number | null;
    byFormat: Record<9 | 18, ScoreFormatSummary>;
  }[];
  recentRounds: PublicRoundSummary[];
  roundCalendars: RoundCalendar[];
  frontBack: {
    frontAvgVsPar: number | null;
    backAvgVsPar: number | null;
    avgSwing: number | null;
    backBetterOrTiedPct: number | null;
  };
};

export type RoundCalendar = {
  year: number;
  days: RoundCalendarDay[];
};

export type PublicRoundSummary = {
  id: string;
  date: Date;
  courseName: string;
  city: string;
  teeName: string | null;
  holeCount: number;
  totalStrokes: number;
  totalPar: number;
  scoreDiff: number | null;
};

export type RoundCalendarDay = {
  date: string;
  rounds: {
    id: string;
    courseName: string;
    city: string;
    teeName: string | null;
    holeCount: number;
    totalStrokes: number;
    totalPar: number;
    scoreDiff: number | null;
  }[];
};

export type ShareableUser = {
  id: string;
  name: string;
  image: string | null;
};

export type PendingRoundSummary = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  date: Date;
  holeCount: number;
  totalStrokes: number;
  totalPar: number;
  scoreDiff: number | null;
  scorecardPlayerName: string | null;
  scorecardRowLabel: string | null;
  createdAt: Date;
  actedAt: Date | null;
  course: { id: string; name: string; city: string };
  tee: { id: string; name: string } | null;
  sender: ShareableUser;
  recipient: ShareableUser;
  acceptedRoundId: string | null;
};

export async function getShareableUsers(currentUserId: string): Promise<ShareableUser[]> {
  return prisma.user.findMany({
    where: { id: { not: currentUserId } },
    select: { id: true, name: true, image: true },
    orderBy: { name: "asc" },
  });
}

export async function getRoundsForUser(userId: string): Promise<RoundFull[]> {
  return prisma.round.findMany({
    where: { userId },
    include: roundFullInclude,
    orderBy: { date: "desc" },
  });
}

export type RoundsPage = {
  rounds: RoundFull[];
  nextCursor: string | null;
};

/**
 * Cursor-paginated rounds for a user, newest first.
 * Caller passes `cursor` = the id of the last visible round to get the next page.
 */
export async function getRoundsPageForUser(
  userId: string,
  opts: { take?: number; cursor?: string | null } = {},
): Promise<RoundsPage> {
  const take = opts.take ?? 50;
  const fetched = await prisma.round.findMany({
    where: { userId },
    include: roundFullInclude,
    orderBy: [{ date: "desc" }, { id: "desc" }],
    take: take + 1,
    skip: opts.cursor ? 1 : 0,
    cursor: opts.cursor ? { id: opts.cursor } : undefined,
  });
  const hasMore = fetched.length > take;
  const rounds = hasMore ? fetched.slice(0, take) : fetched;
  const nextCursor = hasMore ? rounds[rounds.length - 1]?.id ?? null : null;
  return { rounds, nextCursor };
}

export async function getPendingInboxCount(userId: string): Promise<number> {
  return prisma.pendingRound.count({
    where: { recipientUserId: userId, status: "PENDING" },
  });
}

export type PendingInboxPage = {
  rounds: PendingRoundSummary[];
  nextCursor: string | null;
};

/**
 * Cursor-paginated received pending-rounds inbox, newest first.
 * Includes ACCEPTED / REJECTED entries; the dedicated inbox page can choose to
 * filter to PENDING for the badge count.
 */
export async function getReceivedPendingRoundsPageForUser(
  userId: string,
  opts: { take?: number; cursor?: string | null; statuses?: ("PENDING" | "ACCEPTED" | "REJECTED")[] } = {},
): Promise<PendingInboxPage> {
  const take = opts.take ?? 50;
  const fetched = await prisma.pendingRound.findMany({
    where: {
      recipientUserId: userId,
      ...(opts.statuses ? { status: { in: opts.statuses } } : {}),
    },
    include: pendingRoundSummaryInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    skip: opts.cursor ? 1 : 0,
    cursor: opts.cursor ? { id: opts.cursor } : undefined,
  });
  const hasMore = fetched.length > take;
  const rounds = hasMore ? fetched.slice(0, take) : fetched;
  const nextCursor = hasMore ? rounds[rounds.length - 1]?.id ?? null : null;
  return { rounds, nextCursor };
}

export async function getPendingRoundSummariesForUser(userId: string): Promise<{
  received: PendingRoundSummary[];
  sent: PendingRoundSummary[];
}> {
  const [received, sent] = await Promise.all([
    prisma.pendingRound.findMany({
      where: { recipientUserId: userId },
      include: pendingRoundSummaryInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.pendingRound.findMany({
      where: { senderUserId: userId },
      include: pendingRoundSummaryInclude,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { received, sent };
}

export async function getPendingRoundForRecipient(pendingRoundId: string, userId: string) {
  return prisma.pendingRound.findFirst({
    where: { id: pendingRoundId, recipientUserId: userId },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      recipient: { select: { id: true, name: true, image: true } },
      course: true,
      tee: true,
      holes: { orderBy: { holeNumber: "asc" } },
    },
  });
}

export async function getRoundForUser(
  roundId: string,
  userId: string,
): Promise<RoundFull | null> {
  return prisma.round.findFirst({
    where: { id: roundId, userId },
    include: roundFullInclude,
  });
}

export type RoundForViewer = RoundFull & {
  user: Pick<User, "id" | "name" | "image"> | null;
};

export async function getRoundForViewer(roundId: string): Promise<RoundForViewer | null> {
  return prisma.round.findUnique({
    where: { id: roundId },
    include: {
      ...roundFullInclude,
      user: { select: { id: true, name: true, image: true } },
    },
  });
}

export async function getCoursesForNewRound() {
  return prisma.course.findMany({
    include: { tees: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export async function getSharedCoursesWithUserCounts(userId: string) {
  return prisma.course.findMany({
    include: {
      tees: true,
      _count: { select: { rounds: { where: { userId } } } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getSharedCourseForUser(courseId: string, userId: string) {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: {
      tees: { orderBy: { name: "asc" } },
      rounds: {
        where: { userId },
        include: { tee: true, holes: { orderBy: { holeNumber: "asc" } } },
        orderBy: { date: "desc" },
      },
    },
  });
}

export async function listPublicPlayerStats(): Promise<PublicPlayerStats[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      tournamentParticipants: {
        select: publicTournamentIdentitySelect,
        orderBy: [{ edition: { year: "desc" } }, { displayOrder: "asc" }],
      },
      rounds: {
        include: roundFullInclude,
        orderBy: { date: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return users
    .map((user) => buildPublicPlayerStats(user, user.rounds))
    .sort((a, b) => b.roundsAllTime - a.roundsAllTime || a.user.name.localeCompare(b.user.name));
}

export async function getPublicPlayerStats(playerId: string): Promise<PublicPlayerStats | null> {
  const user = await prisma.user.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      name: true,
      image: true,
      tournamentParticipants: {
        select: publicTournamentIdentitySelect,
        orderBy: [{ edition: { year: "desc" } }, { displayOrder: "asc" }],
      },
      rounds: {
        include: roundFullInclude,
        orderBy: { date: "desc" },
      },
    },
  });

  if (!user) return null;
  return buildPublicPlayerStats(user, user.rounds);
}

type StatsUser = Pick<User, "id" | "name" | "image"> & {
  tournamentParticipants?: {
    id: string;
    displayName: string;
    nickname: string | null;
    role: string;
    image: string | null;
    individualWins: number;
    teamWins: number;
    edition: { year: number; title: string };
    teamMembers: { team: { name: string } }[];
  }[];
};

function buildPublicPlayerStats(user: StatsUser, rounds: RoundFull[]): PublicPlayerStats {
  const year = new Date().getFullYear();
  const chronologicalRounds = [...rounds].sort((a, b) => a.date.getTime() - b.date.getTime());
  const currentYearRounds = rounds.filter((round) => round.date.getFullYear() === year);
  const roundsThisYear = currentYearRounds.length;
  const scores = rounds.map((round) => round.totalStrokes);
  const vsPars = rounds.map((round) => round.totalStrokes - round.totalPar);
  const diffs = rounds
    .map((round) => round.scoreDiff)
    .filter((diff): diff is number => diff != null);
  const { index } = buildDifferentialsAndIndex(rounds.map(toScoringRound));
  const frontBack = frontBackBreakdown(rounds);

  return {
    user: {
      id: user.id,
      name: user.name,
      image: user.image ?? null,
    },
    tournamentIdentities: (user.tournamentParticipants ?? []).map((participant) => ({
      id: participant.id,
      year: participant.edition.year,
      title: participant.edition.title,
      displayName: participant.displayName,
      nickname: participant.nickname,
      role: participant.role,
      image: participant.image,
      teamName: participant.teamMembers[0]?.team.name ?? null,
      individualWins: participant.individualWins,
      teamWins: participant.teamWins,
    })),
    roundsAllTime: rounds.length,
    roundsThisYear,
    handicapIndex: index,
    avgScore: average(scores),
    avgVsPar: average(vsPars),
    bestScore: scores.length > 0 ? Math.min(...scores) : null,
    bestDifferential: diffs.length > 0 ? Math.min(...diffs) : null,
    scoreByFormat: {
      18: summarizeScoreFormat(rounds, 18),
      9: summarizeScoreFormat(rounds, 9),
    },
    leaderboard: {
      "all-time": buildLeaderboardStats(rounds),
      "this-year": buildLeaderboardStats(currentYearRounds),
      "last-5": buildLeaderboardStats(chronologicalRounds.slice(-5)),
    },
    recentTrend: buildRecentTrend(rounds),
    mostPlayedCourses: mostPlayedCourses(rounds),
    recentRounds: buildRecentRounds(rounds),
    roundCalendars: buildRoundCalendars(rounds, year),
    frontBack: {
      frontAvgVsPar: frontBack.front.avgVsPar,
      backAvgVsPar: frontBack.back.avgVsPar,
      avgSwing: frontBack.avgSwing,
      backBetterOrTiedPct: frontBack.backBetterOrTiedPct,
    },
  };
}

const publicTournamentIdentitySelect = {
  id: true,
  displayName: true,
  nickname: true,
  role: true,
  image: true,
  individualWins: true,
  teamWins: true,
  displayOrder: true,
  edition: { select: { year: true, title: true } },
  teamMembers: { select: { team: { select: { name: true } } }, take: 1 },
};

function buildLeaderboardStats(rounds: RoundFull[]): PlayerLeaderboardStats {
  const scores = rounds.map((round) => round.totalStrokes);
  const vsPars = rounds.map((round) => round.totalStrokes - round.totalPar);
  const diffs = rounds
    .map((round) => round.scoreDiff)
    .filter((diff): diff is number => diff != null);

  return {
    rounds: rounds.length,
    avgScore: average(scores),
    avgVsPar: average(vsPars),
    bestScore: scores.length > 0 ? Math.min(...scores) : null,
    bestDifferential: diffs.length > 0 ? Math.min(...diffs) : null,
    byFormat: {
      18: summarizeScoreFormat(rounds, 18),
      9: summarizeScoreFormat(rounds, 9),
    },
  };
}

function toScoringRound(round: RoundFull) {
  return {
    id: round.id,
    date: round.date,
    holeCount: round.holeCount as 9 | 18,
    nineType: (round.nineType ?? null) as "front" | "back" | null,
    totalStrokes: round.totalStrokes,
    pars: round.holes.map((hole) => hole.par),
    holeStrokes: round.holes.map((hole) => hole.strokes),
    rating: round.tee?.rating ?? null,
    slope: round.tee?.slope ?? null,
    rating9F: round.tee?.rating9F ?? null,
    slope9F: round.tee?.slope9F ?? null,
    rating9B: round.tee?.rating9B ?? null,
    slope9B: round.tee?.slope9B ?? null,
    pcc: round.pcc,
  };
}

function buildRecentTrend(rounds: RoundFull[]): PublicPlayerStats["recentTrend"] {
  const chronological = [...rounds].sort((a, b) => a.date.getTime() - b.date.getTime());
  const recent = chronological.slice(-5);
  const previous = chronological.slice(-10, -5);
  const recentAvgVsPar = average(recent.map((round) => round.totalStrokes - round.totalPar));
  const previousAvgVsPar = average(
    previous.map((round) => round.totalStrokes - round.totalPar),
  );
  const delta =
    recentAvgVsPar != null && previousAvgVsPar != null
      ? Math.round((recentAvgVsPar - previousAvgVsPar) * 10) / 10
      : null;

  return {
    recentAvgVsPar,
    previousAvgVsPar,
    delta,
    direction: delta == null ? "unknown" : delta < 0 ? "better" : delta > 0 ? "worse" : "flat",
  };
}

function mostPlayedCourses(rounds: RoundFull[]): PublicPlayerStats["mostPlayedCourses"] {
  const grouped = new Map<string, RoundFull[]>();
  for (const round of rounds) {
    grouped.set(round.courseId, [...(grouped.get(round.courseId) ?? []), round]);
  }

  return [...grouped.values()]
    .map((courseRounds) => {
      const first = courseRounds[0];
      return {
        courseId: first.courseId,
        courseName: first.course.name,
        city: first.course.city,
        roundsPlayed: courseRounds.length,
        avgScore: average(courseRounds.map((round) => round.totalStrokes)),
        byFormat: {
          18: summarizeScoreFormat(courseRounds, 18),
          9: summarizeScoreFormat(courseRounds, 9),
        },
      };
    })
    .sort((a, b) => b.roundsPlayed - a.roundsPlayed || a.courseName.localeCompare(b.courseName))
    .slice(0, 5);
}

function buildRoundCalendars(rounds: RoundFull[], currentYear: number): RoundCalendar[] {
  const years = new Set<number>([currentYear]);
  for (const round of rounds) years.add(round.date.getFullYear());

  return [...years]
    .sort((a, b) => b - a)
    .map((year) =>
      buildRoundCalendar(
        rounds.filter((round) => round.date.getFullYear() === year),
        year,
      ),
    );
}

function buildRoundCalendar(rounds: RoundFull[], year: number): RoundCalendar {
  const grouped = new Map<string, RoundCalendarDay["rounds"]>();
  for (const round of rounds) {
    const date = round.date.toISOString().slice(0, 10);
    grouped.set(date, [
      ...(grouped.get(date) ?? []),
      {
        id: round.id,
        courseName: round.course.name,
        city: round.course.city,
        teeName: round.tee?.name ?? null,
        holeCount: round.holeCount,
        totalStrokes: round.totalStrokes,
        totalPar: round.totalPar,
        scoreDiff: round.scoreDiff ?? null,
      },
    ]);
  }

  return {
    year,
    days: [...grouped.entries()]
      .map(([date, dayRounds]) => ({
        date,
        rounds: dayRounds.sort((a, b) => a.courseName.localeCompare(b.courseName)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function buildRecentRounds(rounds: RoundFull[]): PublicRoundSummary[] {
  return [...rounds]
    .sort((a, b) => b.date.getTime() - a.date.getTime() || b.id.localeCompare(a.id))
    .slice(0, 5)
    .map((round) => ({
      id: round.id,
      date: round.date,
      courseName: round.course.name,
      city: round.course.city,
      teeName: round.tee?.name ?? null,
      holeCount: round.holeCount,
      totalStrokes: round.totalStrokes,
      totalPar: round.totalPar,
      scoreDiff: round.scoreDiff ?? null,
    }));
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

const roundFullInclude = {
  course: true,
  tee: true,
  holes: { orderBy: { holeNumber: "asc" as const } },
};

const pendingRoundSummaryInclude = {
  course: { select: { id: true, name: true, city: true } },
  tee: { select: { id: true, name: true } },
  sender: { select: { id: true, name: true, image: true } },
  recipient: { select: { id: true, name: true, image: true } },
};
