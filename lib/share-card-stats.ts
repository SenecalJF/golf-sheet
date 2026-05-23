import "server-only";

import { format } from "date-fns";
import type { RoundFull } from "@/lib/stats";

export type ShareCardScoreBreakdown = {
  eaglesOrBetter: number;
  birdies: number;
  pars: number;
  bogeys: number;
  doubles: number;
  triplesOrWorse: number;
};

export type ShareCardStats = {
  courseName: string;
  city: string;
  dateLabel: string;
  holeCount: 9 | 18;
  /** "Front" or "Back" for 9-hole rounds, null for 18. */
  nineLabel: "Front 9" | "Back 9" | null;
  totalStrokes: number;
  totalPar: number;
  /** totalStrokes − totalPar; can be negative. */
  overPar: number;
  /** Cached `Round.scoreDiff` or null when no rating/slope. */
  scoreDiff: number | null;
  /** Sum of strokes for holes 1–9, or null for 9-hole rounds. */
  frontTotal: number | null;
  /** Sum of strokes for holes 10–18, or null for 9-hole rounds. */
  backTotal: number | null;
  /** Best (lowest) per-hole score over par, e.g. -2 for an eagle. */
  bestHoleOverPar: number | null;
  scoreBreakdown: ShareCardScoreBreakdown;
  /** Owner's name; null if unknown (we don't leak email here). */
  userName: string | null;
};

/**
 * Build the structured payload the share-card renderer consumes. Pure-ish:
 * derived entirely from the RoundFull row + owner's display name.
 */
export function buildShareCardStats(
  round: RoundFull,
  userName: string | null,
): ShareCardStats {
  const holeCount = round.holeCount === 9 ? 9 : 18;
  const nineLabel: ShareCardStats["nineLabel"] =
    holeCount === 9
      ? round.nineType === "back"
        ? "Back 9"
        : "Front 9"
      : null;

  const overPar = round.totalStrokes - round.totalPar;

  const sortedHoles = [...round.holes].sort((a, b) => a.holeNumber - b.holeNumber);
  let frontTotal: number | null = null;
  let backTotal: number | null = null;
  if (holeCount === 18) {
    frontTotal = sortedHoles
      .filter((h) => h.holeNumber <= 9)
      .reduce((s, h) => s + h.strokes, 0);
    backTotal = sortedHoles
      .filter((h) => h.holeNumber > 9)
      .reduce((s, h) => s + h.strokes, 0);
  }

  const bestHoleOverPar =
    sortedHoles.length > 0
      ? sortedHoles.reduce(
          (best, h) => Math.min(best, h.strokes - h.par),
          Number.POSITIVE_INFINITY,
        )
      : null;

  const scoreBreakdown = sortedHoles.reduce<ShareCardScoreBreakdown>(
    (counts, hole) => {
      const relativeToPar = hole.strokes - hole.par;
      if (relativeToPar <= -2) counts.eaglesOrBetter += 1;
      else if (relativeToPar === -1) counts.birdies += 1;
      else if (relativeToPar === 0) counts.pars += 1;
      else if (relativeToPar === 1) counts.bogeys += 1;
      else if (relativeToPar === 2) counts.doubles += 1;
      else counts.triplesOrWorse += 1;
      return counts;
    },
    {
      eaglesOrBetter: 0,
      birdies: 0,
      pars: 0,
      bogeys: 0,
      doubles: 0,
      triplesOrWorse: 0,
    },
  );

  return {
    courseName: round.course.name,
    city: round.course.city,
    dateLabel: format(round.date, "MMM d, yyyy"),
    holeCount,
    nineLabel,
    totalStrokes: round.totalStrokes,
    totalPar: round.totalPar,
    overPar,
    scoreDiff: round.scoreDiff ?? null,
    frontTotal,
    backTotal,
    bestHoleOverPar:
      bestHoleOverPar == null || !Number.isFinite(bestHoleOverPar)
        ? null
        : bestHoleOverPar,
    scoreBreakdown,
    userName: userName?.trim() || null,
  };
}
