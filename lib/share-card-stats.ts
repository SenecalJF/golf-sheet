import "server-only";

import { format } from "date-fns";
import { parTypeBreakdown, type RoundFull } from "@/lib/stats";

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
  /** Par 3 / 4 / 5 averages relative to par for THIS round. */
  parTypeAverages: { par3: number | null; par4: number | null; par5: number | null };
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

  const parBreakdown = parTypeBreakdown([round]);
  const lookup = (p: 3 | 4 | 5) =>
    parBreakdown.find((entry) => entry.parType === p && entry.holes > 0)?.avgVsPar ?? null;

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
    parTypeAverages: {
      par3: lookup(3),
      par4: lookup(4),
      par5: lookup(5),
    },
    userName: userName?.trim() || null,
  };
}
