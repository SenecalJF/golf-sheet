import type { Tee } from "@prisma/client";
import { computeScoreDifferential } from "@/lib/handicap";
import type { HoleInput, RoundInput } from "@/lib/types";

type TeeForScoring = Pick<
  Tee,
  "rating" | "slope" | "rating9F" | "slope9F" | "rating9B" | "slope9B"
> | null;

export function validateRoundHoles(input: {
  holeCount: 9 | 18;
  holes: HoleInput[];
}): string | null {
  if (input.holes.length !== input.holeCount) {
    return `Expected ${input.holeCount} holes, got ${input.holes.length}`;
  }
  const holeNumbers = new Set(input.holes.map((hole) => hole.holeNumber));
  if (holeNumbers.size !== input.holes.length) return "Hole numbers must be unique";
  return null;
}

export function summarizeRoundScore(
  input: Pick<RoundInput, "date" | "holeCount" | "nineType" | "pcc" | "holes">,
  tee: TeeForScoring,
  id = "preview",
): { totalStrokes: number; totalPar: number; scoreDiff: number | null } {
  const totalStrokes = input.holes.reduce((sum, hole) => sum + hole.strokes, 0);
  const totalPar = input.holes.reduce((sum, hole) => sum + hole.par, 0);
  const date = new Date(input.date);
  const scoreDiff = tee
    ? computeScoreDifferential({
        id,
        date,
        holeCount: input.holeCount,
        nineType: input.holeCount === 9 ? input.nineType ?? null : null,
        totalStrokes,
        pars: input.holes.map((hole) => hole.par),
        holeStrokes: input.holes.map((hole) => hole.strokes),
        rating: tee.rating,
        slope: tee.slope,
        rating9F: tee.rating9F,
        slope9F: tee.slope9F,
        rating9B: tee.rating9B,
        slope9B: tee.slope9B,
        pcc: input.pcc,
      })
    : null;

  return { totalStrokes, totalPar, scoreDiff };
}

export function holeCreateRows(holes: HoleInput[]) {
  return holes.map((hole) => ({
    holeNumber: hole.holeNumber,
    par: hole.par,
    strokes: hole.strokes,
    putts: hole.putts ?? null,
    confidence: hole.confidence ?? null,
    illegible: hole.illegible ?? false,
  }));
}
