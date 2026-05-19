import "server-only";

import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildDifferentialsAndIndex } from "@/lib/handicap";
import { frontBackBreakdown, type RoundFull } from "@/lib/stats";

export type LeaderboardPeriod = "all-time" | "this-year" | "last-5";

export type PlayerLeaderboardStats = {
  rounds: number;
  avgScore: number | null;
  avgVsPar: number | null;
  bestScore: number | null;
  bestDifferential: number | null;
};

export type PublicPlayerStats = {
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  roundsAllTime: number;
  roundsThisYear: number;
  handicapIndex: number | null;
  avgScore: number | null;
  avgVsPar: number | null;
  bestScore: number | null;
  bestDifferential: number | null;
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
  }[];
  frontBack: {
    frontAvgVsPar: number | null;
    backAvgVsPar: number | null;
    avgSwing: number | null;
    backBetterOrTiedPct: number | null;
  };
};

export async function getRoundsForUser(userId: string): Promise<RoundFull[]> {
  return prisma.round.findMany({
    where: { userId },
    include: roundFullInclude,
    orderBy: { date: "desc" },
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
      rounds: {
        include: roundFullInclude,
        orderBy: { date: "desc" },
      },
    },
  });

  if (!user) return null;
  return buildPublicPlayerStats(user, user.rounds);
}

type StatsUser = Pick<User, "id" | "name" | "image">;

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
    roundsAllTime: rounds.length,
    roundsThisYear,
    handicapIndex: index,
    avgScore: average(scores),
    avgVsPar: average(vsPars),
    bestScore: scores.length > 0 ? Math.min(...scores) : null,
    bestDifferential: diffs.length > 0 ? Math.min(...diffs) : null,
    leaderboard: {
      "all-time": buildLeaderboardStats(rounds),
      "this-year": buildLeaderboardStats(currentYearRounds),
      "last-5": buildLeaderboardStats(chronologicalRounds.slice(-5)),
    },
    recentTrend: buildRecentTrend(rounds),
    mostPlayedCourses: mostPlayedCourses(rounds),
    frontBack: {
      frontAvgVsPar: frontBack.front.avgVsPar,
      backAvgVsPar: frontBack.back.avgVsPar,
      avgSwing: frontBack.avgSwing,
      backBetterOrTiedPct: frontBack.backBetterOrTiedPct,
    },
  };
}

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
      };
    })
    .sort((a, b) => b.roundsPlayed - a.roundsPlayed || a.courseName.localeCompare(b.courseName))
    .slice(0, 5);
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
