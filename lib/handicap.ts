/**
 * World Handicap System (WHS 2024) calculations.
 * - Score Differential = (113 / Slope) × (AGS − Course Rating − PCC)
 * - Handicap Index = average of the lowest N of last 20 differentials, with a sliding adjustment
 */

export type ScoringRound = {
  id: string;
  date: Date;
  holeCount: 9 | 18;
  nineType?: "front" | "back" | null;
  totalStrokes: number;
  pars: number[];
  holeStrokes: number[];
  rating?: number | null;
  slope?: number | null;
  rating9F?: number | null;
  slope9F?: number | null;
  rating9B?: number | null;
  slope9B?: number | null;
  pcc?: number;
};

export type Differential = {
  roundId: string | string[];
  date: Date;
  value: number;
  source: "18" | "9-pair" | "9-orphan";
};

const SCALE: Record<number, { count: number; adjustment: number }> = {
  3: { count: 1, adjustment: -2.0 },
  4: { count: 1, adjustment: -1.0 },
  5: { count: 1, adjustment: 0 },
  6: { count: 2, adjustment: -1.0 },
  7: { count: 2, adjustment: 0 },
  8: { count: 2, adjustment: 0 },
  9: { count: 3, adjustment: 0 },
  10: { count: 3, adjustment: 0 },
  11: { count: 3, adjustment: 0 },
  12: { count: 4, adjustment: 0 },
  13: { count: 4, adjustment: 0 },
  14: { count: 4, adjustment: 0 },
  15: { count: 5, adjustment: 0 },
  16: { count: 5, adjustment: 0 },
  17: { count: 6, adjustment: 0 },
  18: { count: 6, adjustment: 0 },
  19: { count: 7, adjustment: 0 },
  20: { count: 8, adjustment: 0 },
};

/**
 * Adjusted Gross Score: cap each hole at (par + 5) for new golfers (no index yet),
 * otherwise use proper Net Double Bogey (par + 2 + handicap strokes received on hole).
 * For simplicity in v1, we always use the par+5 cap.
 */
export function adjustedGrossScore(holeStrokes: number[], pars: number[]): number {
  let sum = 0;
  for (let i = 0; i < holeStrokes.length; i++) {
    const par = pars[i] ?? 4;
    const cap = par + 5;
    sum += Math.min(holeStrokes[i], cap);
  }
  return sum;
}

/**
 * Compute a single round's score differential.
 * For 18-hole rounds → uses full course rating/slope.
 * For 9-hole rounds → uses 9-hole rating/slope (front or back) if available, else falls back
 * to half the 18-hole rating and the same slope.
 * Returns null if rating/slope are missing.
 */
export function computeScoreDifferential(r: ScoringRound): number | null {
  const ags = adjustedGrossScore(r.holeStrokes, r.pars);
  const pcc = r.pcc ?? 0;

  if (r.holeCount === 18) {
    if (r.rating == null || r.slope == null) return null;
    const diff = (113 / r.slope) * (ags - r.rating - pcc);
    return Math.round(diff * 10) / 10;
  }

  // 9-hole differential
  let rating9: number | null | undefined;
  let slope9: number | null | undefined;
  if (r.nineType === "front") {
    rating9 = r.rating9F;
    slope9 = r.slope9F;
  } else if (r.nineType === "back") {
    rating9 = r.rating9B;
    slope9 = r.slope9B;
  }
  if (rating9 == null || slope9 == null) {
    // fallback: half rating, same slope
    if (r.rating == null || r.slope == null) return null;
    rating9 = r.rating / 2;
    slope9 = r.slope;
  }
  const diff = (113 / slope9) * (ags - rating9 - pcc);
  return Math.round(diff * 10) / 10;
}

/**
 * Pair 9-hole differentials chronologically into 18-hole-equivalents.
 * Two consecutive 9-hole diffs sum (since each was already on 9-hole rating).
 * Returns the combined diffs plus any orphan (unpaired) 9-hole diff.
 */
export function combineNineHoleDiffs(
  nineDiffs: { roundId: string; date: Date; value: number }[],
): { paired: Differential[]; orphans: Differential[] } {
  const sorted = [...nineDiffs].sort((a, b) => a.date.getTime() - b.date.getTime());
  const paired: Differential[] = [];
  const orphans: Differential[] = [];
  for (let i = 0; i + 1 < sorted.length; i += 2) {
    const a = sorted[i];
    const b = sorted[i + 1];
    paired.push({
      roundId: [a.roundId, b.roundId],
      date: b.date,
      value: Math.round((a.value + b.value) * 10) / 10,
      source: "9-pair",
    });
  }
  if (sorted.length % 2 === 1) {
    const last = sorted[sorted.length - 1];
    orphans.push({ roundId: last.roundId, date: last.date, value: last.value, source: "9-orphan" });
  }
  return { paired, orphans };
}

/**
 * Compute Handicap Index from a list of differentials (mix of 18 and 9-paired).
 * Returns null if fewer than 3 valid differentials.
 */
export function computeHandicapIndex(diffs: Differential[]): number | null {
  if (diffs.length < 3) return null;
  const sortedByDate = [...diffs].sort((a, b) => a.date.getTime() - b.date.getTime());
  const recent = sortedByDate.slice(-20);
  const n = Math.min(recent.length, 20);
  const rule = SCALE[n] ?? SCALE[20];
  const values = recent.map((d) => d.value).sort((a, b) => a - b);
  const best = values.slice(0, rule.count);
  const avg = best.reduce((s, x) => s + x, 0) / rule.count;
  return Math.round((avg + rule.adjustment) * 10) / 10;
}

/**
 * Convenience: build differentials from a flat list of rounds and compute the index.
 */
export function buildDifferentialsAndIndex(rounds: ScoringRound[]): {
  diffs: Differential[];
  index: number | null;
  orphans: Differential[];
} {
  const eighteen: Differential[] = [];
  const nines: { roundId: string; date: Date; value: number }[] = [];

  for (const r of rounds) {
    const d = computeScoreDifferential(r);
    if (d == null) continue;
    if (r.holeCount === 18) {
      eighteen.push({ roundId: r.id, date: r.date, value: d, source: "18" });
    } else {
      nines.push({ roundId: r.id, date: r.date, value: d });
    }
  }
  const { paired, orphans } = combineNineHoleDiffs(nines);
  const diffs = [...eighteen, ...paired].sort((a, b) => a.date.getTime() - b.date.getTime());
  return { diffs, index: computeHandicapIndex(diffs), orphans };
}
