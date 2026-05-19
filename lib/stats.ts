import type { Round, HoleScore, Course, Tee } from "@prisma/client";

export type RoundFull = Round & { course: Course; tee: Tee | null; holes: HoleScore[] };

export type TrendPoint = {
  date: string;
  roundId: string;
  course: string;
  totalStrokes: number;
  totalPar: number;
  overPar: number;
  scoreDiff: number | null;
};

export function buildTrend(rounds: RoundFull[]): TrendPoint[] {
  return [...rounds]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      roundId: r.id,
      course: r.course.name,
      totalStrokes: r.totalStrokes,
      totalPar: r.totalPar,
      overPar: r.totalStrokes - r.totalPar,
      scoreDiff: r.scoreDiff ?? null,
    }));
}

export type ParTypeStat = {
  parType: 3 | 4 | 5;
  holes: number;
  avg: number;
  avgVsPar: number;
};

export function parTypeBreakdown(rounds: RoundFull[]): ParTypeStat[] {
  const buckets: Record<number, { sum: number; n: number }> = {
    3: { sum: 0, n: 0 },
    4: { sum: 0, n: 0 },
    5: { sum: 0, n: 0 },
  };
  for (const r of rounds) {
    for (const h of r.holes) {
      const par = h.par;
      if (par === 3 || par === 4 || par === 5) {
        buckets[par].sum += h.strokes;
        buckets[par].n += 1;
      }
    }
  }
  return ([3, 4, 5] as const).map((p) => {
    const b = buckets[p];
    const avg = b.n > 0 ? b.sum / b.n : 0;
    return {
      parType: p,
      holes: b.n,
      avg: Math.round(avg * 100) / 100,
      avgVsPar: Math.round((avg - p) * 100) / 100,
    };
  });
}

export type HoleHeatmapCell = {
  holeNumber: number;
  par: number;
  rounds: number;
  avgStrokes: number;
  avgVsPar: number;
};

export function holeHeatmap(rounds: RoundFull[]): HoleHeatmapCell[] {
  const cells: Record<number, { sum: number; n: number; par: number }> = {};
  for (const r of rounds) {
    for (const h of r.holes) {
      const k = h.holeNumber;
      const cur = cells[k] ?? { sum: 0, n: 0, par: h.par };
      cur.sum += h.strokes;
      cur.n += 1;
      cur.par = h.par;
      cells[k] = cur;
    }
  }
  return Object.entries(cells)
    .map(([k, v]) => {
      const avg = v.sum / v.n;
      return {
        holeNumber: Number(k),
        par: v.par,
        rounds: v.n,
        avgStrokes: Math.round(avg * 100) / 100,
        avgVsPar: Math.round((avg - v.par) * 100) / 100,
      };
    })
    .sort((a, b) => a.holeNumber - b.holeNumber);
}

export type NineSide = "front" | "back";

export type NineSideStat = {
  side: NineSide;
  nines: number;
  holes: number;
  avgStrokes: number | null;
  avgPar: number | null;
  avgVsPar: number | null;
  bestVsPar: number | null;
  worstVsPar: number | null;
};

export type FrontBackPair = {
  roundId: string;
  date: string;
  course: string;
  frontStrokes: number;
  frontPar: number;
  frontVsPar: number;
  backStrokes: number;
  backPar: number;
  backVsPar: number;
  swing: number;
};

export type FrontBackStats = {
  front: NineSideStat;
  back: NineSideStat;
  pairs: FrontBackPair[];
  pairedRounds: number;
  avgSwing: number | null;
  recentSwing: number | null;
  backBetterOrTiedPct: number | null;
  bestFinish: FrontBackPair | null;
  worstFinish: FrontBackPair | null;
};

type NineSample = {
  side: NineSide;
  holes: number;
  strokes: number;
  par: number;
  vsPar: number;
};

export function frontBackBreakdown(rounds: RoundFull[]): FrontBackStats {
  const samples: NineSample[] = [];
  const pairs: FrontBackPair[] = [];

  for (const r of rounds) {
    const sorted = [...r.holes].sort((a, b) => a.holeNumber - b.holeNumber);
    if (r.holeCount === 18) {
      const byNumberFront = sorted.filter((h) => h.holeNumber >= 1 && h.holeNumber <= 9);
      const byNumberBack = sorted.filter((h) => h.holeNumber >= 10 && h.holeNumber <= 18);
      const frontHoles = byNumberFront.length === 9 ? byNumberFront : sorted.slice(0, 9);
      const backHoles = byNumberBack.length === 9 ? byNumberBack : sorted.slice(9, 18);

      if (frontHoles.length > 0) samples.push(makeNineSample("front", frontHoles));
      if (backHoles.length > 0) samples.push(makeNineSample("back", backHoles));

      if (frontHoles.length === 9 && backHoles.length === 9) {
        const front = makeNineSample("front", frontHoles);
        const back = makeNineSample("back", backHoles);
        pairs.push({
          roundId: r.id,
          date: r.date.toISOString().slice(0, 10),
          course: r.course.name,
          frontStrokes: front.strokes,
          frontPar: front.par,
          frontVsPar: front.vsPar,
          backStrokes: back.strokes,
          backPar: back.par,
          backVsPar: back.vsPar,
          swing: back.vsPar - front.vsPar,
        });
      }
      continue;
    }

    const nineSide = inferNineSide(r);
    if (nineSide) samples.push(makeNineSample(nineSide, sorted));
  }

  const sortedPairs = pairs.sort((a, b) => a.date.localeCompare(b.date));
  const recentPairs = sortedPairs.slice(-5);
  const betterOrTied = sortedPairs.filter((p) => p.swing <= 0).length;

  return {
    front: summarizeNineSide("front", samples),
    back: summarizeNineSide("back", samples),
    pairs: sortedPairs,
    pairedRounds: sortedPairs.length,
    avgSwing: average(sortedPairs.map((p) => p.swing)),
    recentSwing: average(recentPairs.map((p) => p.swing)),
    backBetterOrTiedPct:
      sortedPairs.length > 0 ? Math.round((betterOrTied / sortedPairs.length) * 100) : null,
    bestFinish:
      sortedPairs.length > 0
        ? sortedPairs.reduce((best, p) => (p.swing < best.swing ? p : best), sortedPairs[0])
        : null,
    worstFinish:
      sortedPairs.length > 0
        ? sortedPairs.reduce((worst, p) => (p.swing > worst.swing ? p : worst), sortedPairs[0])
        : null,
  };
}

function inferNineSide(r: RoundFull): NineSide | null {
  if (r.nineType === "front" || r.nineType === "back") return r.nineType;
  if (r.holes.every((h) => h.holeNumber >= 10)) return "back";
  if (r.holes.every((h) => h.holeNumber <= 9)) return "front";
  return null;
}

function makeNineSample(side: NineSide, holes: HoleScore[]): NineSample {
  const strokes = holes.reduce((sum, h) => sum + h.strokes, 0);
  const par = holes.reduce((sum, h) => sum + h.par, 0);
  return { side, holes: holes.length, strokes, par, vsPar: strokes - par };
}

function summarizeNineSide(side: NineSide, samples: NineSample[]): NineSideStat {
  const sideSamples = samples.filter((s) => s.side === side);
  const strokes = sideSamples.map((s) => s.strokes);
  const pars = sideSamples.map((s) => s.par);
  const vsPars = sideSamples.map((s) => s.vsPar);

  return {
    side,
    nines: sideSamples.length,
    holes: sideSamples.reduce((sum, s) => sum + s.holes, 0),
    avgStrokes: average(strokes),
    avgPar: average(pars),
    avgVsPar: average(vsPars),
    bestVsPar: minOrNull(vsPars),
    worstVsPar: maxOrNull(vsPars),
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function minOrNull(values: number[]): number | null {
  return values.length > 0 ? Math.min(...values) : null;
}

function maxOrNull(values: number[]): number | null {
  return values.length > 0 ? Math.max(...values) : null;
}

export type CourseSummary = {
  courseId: string;
  courseName: string;
  city: string;
  roundsPlayed: number;
  byFormat: Record<9 | 18, ScoreFormatSummary>;
};

export type ScoreFormatSummary = {
  rounds: number;
  best: number | null;
  avg: number | null;
  worst: number | null;
  bestOverPar: number | null;
  avgOverPar: number | null;
};

type ScoreFormatRound = Pick<RoundFull, "holeCount" | "totalStrokes" | "totalPar">;

export function perCourseSummary(rounds: RoundFull[]): CourseSummary[] {
  const grouped: Record<string, RoundFull[]> = {};
  for (const r of rounds) {
    if (!grouped[r.courseId]) grouped[r.courseId] = [];
    grouped[r.courseId].push(r);
  }
  return Object.values(grouped).map((rs) => {
    const r0 = rs[0];
    return {
      courseId: r0.courseId,
      courseName: r0.course.name,
      city: r0.course.city,
      roundsPlayed: rs.length,
      byFormat: {
        18: summarizeScoreFormat(rs, 18),
        9: summarizeScoreFormat(rs, 9),
      },
    };
  });
}

export function summarizeScoreFormat(
  rounds: ScoreFormatRound[],
  holeCount: 9 | 18,
): ScoreFormatSummary {
  const filtered = rounds.filter((round) => round.holeCount === holeCount);
  if (filtered.length === 0) {
    return {
      rounds: 0,
      best: null,
      avg: null,
      worst: null,
      bestOverPar: null,
      avgOverPar: null,
    };
  }

  const totals = filtered.map((round) => round.totalStrokes);
  const overs = filtered.map((round) => round.totalStrokes - round.totalPar);
  const avg = totals.reduce((sum, value) => sum + value, 0) / totals.length;
  const avgOver = overs.reduce((sum, value) => sum + value, 0) / overs.length;

  return {
    rounds: filtered.length,
    best: Math.min(...totals),
    avg: Math.round(avg * 10) / 10,
    worst: Math.max(...totals),
    bestOverPar: Math.min(...overs),
    avgOverPar: Math.round(avgOver * 10) / 10,
  };
}
