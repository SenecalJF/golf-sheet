const TOURNAMENT_TIME_ZONE = "America/Montreal";
const TITS_OPEN_2026_SCORE_SUBMISSION_OPENS_AT = "2026-07-18T10:00:00.000Z";

export type TournamentSubmissionWindowInput = {
  seriesSlug: string;
  year: number;
  config?: unknown;
};

export function getTournamentScoreSubmissionState(
  input: TournamentSubmissionWindowInput,
  now = new Date(),
) {
  const opensAt = getTournamentScoreSubmissionOpensAt(input);
  const isOpen = !opensAt || now.getTime() >= new Date(opensAt).getTime();

  return {
    isOpen,
    opensAt,
    opensAtLabel: opensAt ? formatTournamentScoreSubmissionOpensAt(opensAt) : null,
  };
}

export function getTournamentScoreSubmissionOpensAt(
  input: TournamentSubmissionWindowInput,
) {
  const configuredOpensAt = asRecord(input.config)?.scoreSubmissionOpensAt;
  if (typeof configuredOpensAt === "string" && isValidDate(configuredOpensAt)) {
    return configuredOpensAt;
  }

  if (input.seriesSlug === "tits-open" && input.year === 2026) {
    return TITS_OPEN_2026_SCORE_SUBMISSION_OPENS_AT;
  }

  return null;
}

function formatTournamentScoreSubmissionOpensAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TOURNAMENT_TIME_ZONE,
    timeZoneName: "short",
  }).format(new Date(value));
}

function isValidDate(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
