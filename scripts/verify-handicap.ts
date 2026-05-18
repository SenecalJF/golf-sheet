import {
  computeScoreDifferential,
  computeHandicapIndex,
  buildDifferentialsAndIndex,
  adjustedGrossScore,
  type Differential,
  type ScoringRound,
} from "../lib/handicap";

function check(label: string, expected: number, actual: number | null, tol = 0.05) {
  const ok = actual != null && Math.abs(actual - expected) <= tol;
  console.log(`${ok ? "✓" : "✗"} ${label}: expected ${expected}, got ${actual}`);
  if (!ok) process.exitCode = 1;
}

// Test 1: AGS with par+5 cap
const pars18 = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5];
const cleanStrokes = [5, 5, 4, 6, 5, 5, 4, 5, 6, 5, 5, 4, 6, 5, 5, 4, 5, 6];
const ags = adjustedGrossScore(cleanStrokes, pars18);
check("AGS clean", cleanStrokes.reduce((s, x) => s + x, 0), ags);

const blowupStrokes = [...cleanStrokes];
blowupStrokes[0] = 12; // capped to 4 + 5 = 9
const agsCapped = adjustedGrossScore(blowupStrokes, pars18);
check("AGS capped", ags - 5 + 9, agsCapped); // original sum + 7 → AGS adds (9 - 5)=4 on top of clean

// Test 2: single 18-hole differential
// AGS 92, slope 130, rating 71.2, PCC 0 → (113/130)*(92-71.2) = 0.8692 × 20.8 = 18.08 → 18.1
const round1: ScoringRound = {
  id: "r1",
  date: new Date("2026-05-01"),
  holeCount: 18,
  totalStrokes: 92,
  pars: pars18,
  holeStrokes: pars18.map((p) => p + 1), // 1 over each = 18 over = 90 +1 each
  rating: 71.2,
  slope: 130,
  pcc: 0,
};
// override holeStrokes to sum to 92 exactly without triggering NDB cap
round1.holeStrokes = pars18.map((p) => p + 1);
const sumR1 = round1.holeStrokes.reduce((s, x) => s + x, 0);
round1.holeStrokes[0] += 92 - sumR1; // adjust hole 1 to make sum exactly 92
round1.totalStrokes = 92;
const diff1 = computeScoreDifferential(round1);
check("Differential round 1 (AGS92, slope130, rating71.2)", 18.1, diff1);

// Test 3: handicap from 3 differentials [18.1, 22.4, 16.0] → use lowest 1, adjust -2.0 → 14.0
const diffs3: Differential[] = [
  { roundId: "a", date: new Date("2026-05-01"), value: 18.1, source: "18" },
  { roundId: "b", date: new Date("2026-05-08"), value: 22.4, source: "18" },
  { roundId: "c", date: new Date("2026-05-15"), value: 16.0, source: "18" },
];
const hi3 = computeHandicapIndex(diffs3);
check("Handicap index from 3 diffs", 14.0, hi3);

// Test 4: handicap from 5 → use lowest 1, adjust 0
const diffs5: Differential[] = [
  { roundId: "1", date: new Date("2026-05-01"), value: 20, source: "18" },
  { roundId: "2", date: new Date("2026-05-02"), value: 18, source: "18" },
  { roundId: "3", date: new Date("2026-05-03"), value: 22, source: "18" },
  { roundId: "4", date: new Date("2026-05-04"), value: 16, source: "18" },
  { roundId: "5", date: new Date("2026-05-05"), value: 19, source: "18" },
];
check("Handicap with 5 rounds", 16.0, computeHandicapIndex(diffs5));

// Test 5: handicap from 20 rounds → lowest 8 avg, no adjustment
const diffs20: Differential[] = Array.from({ length: 20 }, (_, i) => ({
  roundId: `r${i}`,
  date: new Date(2026, 0, i + 1),
  value: 10 + i, // 10..29
  source: "18",
}));
// Lowest 8 → 10..17, avg = 13.5
check("Handicap with 20 rounds", 13.5, computeHandicapIndex(diffs20));

// Test 6: 9-hole pairing
const result = buildDifferentialsAndIndex([
  {
    id: "9a",
    date: new Date("2026-04-01"),
    holeCount: 9,
    nineType: "front",
    totalStrokes: 47,
    pars: pars18.slice(0, 9),
    holeStrokes: pars18.slice(0, 9).map((p) => p + 1),
    rating: 71.2,
    slope: 130,
    pcc: 0,
  },
  {
    id: "9b",
    date: new Date("2026-04-02"),
    holeCount: 9,
    nineType: "back",
    totalStrokes: 47,
    pars: pars18.slice(9),
    holeStrokes: pars18.slice(9).map((p) => p + 1),
    rating: 71.2,
    slope: 130,
    pcc: 0,
  },
]);
console.log(
  result.diffs.length === 1 && result.diffs[0].source === "9-pair"
    ? "✓ Two 9-hole rounds pair into one 18-hole-equivalent differential"
    : "✗ 9-hole pairing failed: " + JSON.stringify(result),
);
if (result.diffs.length !== 1 || result.diffs[0].source !== "9-pair") {
  process.exitCode = 1;
}

console.log(process.exitCode ? "\nFAIL" : "\nAll handicap checks passed.");
