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

export type CourseSummary = {
  courseId: string;
  courseName: string;
  city: string;
  roundsPlayed: number;
  best: number | null;
  avg: number | null;
  worst: number | null;
  bestOverPar: number | null;
  avgOverPar: number | null;
};

export function perCourseSummary(rounds: RoundFull[]): CourseSummary[] {
  const grouped: Record<string, RoundFull[]> = {};
  for (const r of rounds) {
    if (!grouped[r.courseId]) grouped[r.courseId] = [];
    grouped[r.courseId].push(r);
  }
  return Object.values(grouped).map((rs) => {
    const totals = rs.map((r) => r.totalStrokes);
    const overs = rs.map((r) => r.totalStrokes - r.totalPar);
    const best = Math.min(...totals);
    const worst = Math.max(...totals);
    const avg = totals.reduce((s, x) => s + x, 0) / totals.length;
    const bestOver = Math.min(...overs);
    const avgOver = overs.reduce((s, x) => s + x, 0) / overs.length;
    const r0 = rs[0];
    return {
      courseId: r0.courseId,
      courseName: r0.course.name,
      city: r0.course.city,
      roundsPlayed: rs.length,
      best,
      worst,
      avg: Math.round(avg * 10) / 10,
      bestOverPar: bestOver,
      avgOverPar: Math.round(avgOver * 10) / 10,
    };
  });
}
