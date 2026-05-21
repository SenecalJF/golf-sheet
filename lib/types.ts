import { z } from "zod";

export const HoleExtractionSchema = z.object({
  hole: z.number().int().min(1).max(18),
  par: z.number().int().min(3).max(6).nullable().optional(),
  strokes: z.number().int().min(1).max(15).nullable(),
  confidence: z.number().min(0).max(1).default(0),
  illegible: z.boolean().default(false),
});

export const ExtractedTeeSchema = z.object({
  name: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  slope: z.number().int().nullable().optional(),
  yardage: z.number().int().nullable().optional(),
});

export const ExtractedPlayerSchema = z.object({
  playerName: z.string().nullable().optional(),
  rowLabel: z.string().nullable().optional(),
  holes: z.array(HoleExtractionSchema),
  confidence: z.number().min(0).max(1).default(0),
  notes: z.string().nullable().optional(),
});

export const ExtractedScorecardSchema = z.object({
  holeCount: z.union([z.literal(9), z.literal(18)]),
  nineType: z.enum(["front", "back"]).nullable().optional(),
  players: z.array(ExtractedPlayerSchema).default([]),
  holes: z.array(HoleExtractionSchema).optional(),
  pars: z.array(z.number().int().min(3).max(6)).nullable().optional(),
  tees: z.array(ExtractedTeeSchema).default([]),
  playerTeeName: z.string().nullable().optional(),
  courseNameGuess: z.string().nullable().optional(),
  dateGuess: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type ExtractedScorecard = z.infer<typeof ExtractedScorecardSchema>;
export type HoleExtraction = z.infer<typeof HoleExtractionSchema>;
export type ExtractedPlayer = z.infer<typeof ExtractedPlayerSchema>;

export const HoleInputSchema = z.object({
  holeNumber: z.number().int().min(1).max(18),
  par: z.number().int().min(3).max(6),
  strokes: z.number().int().min(1).max(15),
  putts: z.number().int().min(0).max(8).nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  illegible: z.boolean().optional(),
});

export const RoundInputSchema = z.object({
  courseId: z.string().min(1),
  teeId: z.string().min(1).nullable().optional(),
  date: z.string().or(z.date()),
  holeCount: z.union([z.literal(9), z.literal(18)]),
  nineType: z.enum(["front", "back"]).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  weather: z.string().max(80).nullable().optional(),
  pcc: z.number().min(-1).max(3).default(0),
  sourceImage: z.string().nullable().optional(),
  extractionModel: z.string().nullable().optional(),
  holes: z.array(HoleInputSchema).min(9).max(18),
});

export const PendingRoundAssignmentSchema = z.object({
  recipientUserId: z.string().min(1),
  scorecardPlayerName: z.string().max(100).nullable().optional(),
  scorecardRowLabel: z.string().max(100).nullable().optional(),
  rowConfidence: z.number().min(0).max(1).nullable().optional(),
  rowNotes: z.string().max(500).nullable().optional(),
  holes: z.array(HoleInputSchema).min(9).max(18),
});

export const TournamentRoundLinkInputSchema = z.object({
  editionId: z.string().min(1),
  editionCourseId: z.string().min(1).nullable().optional(),
});

export const RoundCreateInputSchema = RoundInputSchema.extend({
  pendingAssignments: z.array(PendingRoundAssignmentSchema).max(8).optional(),
  tournamentScore: TournamentRoundLinkInputSchema.optional(),
});

export type RoundInput = z.infer<typeof RoundInputSchema>;
export type RoundCreateInput = z.infer<typeof RoundCreateInputSchema>;
export type HoleInput = z.infer<typeof HoleInputSchema>;
export type PendingRoundAssignment = z.infer<typeof PendingRoundAssignmentSchema>;
export type TournamentRoundLinkInput = z.infer<typeof TournamentRoundLinkInputSchema>;

export const CourseInputSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  province: z.string().default("QC"),
  notes: z.string().optional().nullable(),
});

export const TeeInputSchema = z.object({
  courseId: z.string(),
  name: z.string().min(1),
  color: z.string().optional().nullable(),
  rating: z.number().min(60).max(80).nullable().optional(),
  slope: z.number().int().min(55).max(155).nullable().optional(),
  yardage: z.number().int().min(0).max(10000).nullable().optional(),
  pars: z
    .string()
    .refine(
      (s) => {
        const parts = s.split(",").map((p) => Number(p.trim()));
        if (parts.length !== 9 && parts.length !== 18) return false;
        return parts.every((p) => Number.isInteger(p) && p >= 3 && p <= 6);
      },
      { message: "pars must be 9 or 18 comma-separated integers between 3 and 6" },
    ),
  holeCount: z.union([z.literal(9), z.literal(18)]),
  rating9F: z.number().nullable().optional(),
  slope9F: z.number().int().nullable().optional(),
  rating9B: z.number().nullable().optional(),
  slope9B: z.number().int().nullable().optional(),
});

export const TeeDeleteInputSchema = z.object({
  teeId: z.string().min(1),
});

export type CourseInput = z.infer<typeof CourseInputSchema>;
export type TeeInput = z.infer<typeof TeeInputSchema>;
export type TeeDeleteInput = z.infer<typeof TeeDeleteInputSchema>;

export const TournamentEditionInputSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  subtitle: z.string().max(240).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  status: z.enum(["PLANNED", "LIVE", "COMPLETED", "ARCHIVED"]).optional(),
  layoutKey: z.string().min(2).max(80).optional(),
  heroImage: z.string().max(300).nullable().optional(),
  logoImage: z.string().max(300).nullable().optional(),
  accentColor: z.string().max(40).nullable().optional(),
});

export const TournamentEditionCourseInputSchema = z.object({
  courseId: z.string().min(1),
  teeId: z.string().min(1).nullable().optional(),
  roundNumber: z.number().int().min(1).max(10),
  dayLabel: z.string().max(80).nullable().optional(),
  teeTime: z.string().nullable().optional(),
  holeCount: z.union([z.literal(9), z.literal(18)]),
  notes: z.string().max(500).nullable().optional(),
});

export const TournamentParticipantInputSchema = z.object({
  userId: z.string().min(1).nullable().optional(),
  displayName: z.string().min(2).max(120).trim(),
  slug: z.string().max(120).nullable().optional(),
  nickname: z.string().max(80).nullable().optional(),
  country: z.string().max(80).nullable().optional(),
  bio: z.string().max(800).nullable().optional(),
  role: z.enum(["PLAYER", "CADDIE", "GUEST"]).default("PLAYER"),
  image: z.string().max(300).nullable().optional(),
  handicapSnapshot: z.number().min(-10).max(60).nullable().optional(),
  courseHandicapSnapshot: z.number().int().min(-10).max(80).nullable().optional(),
  individualWins: z.number().int().min(0).max(100).default(0),
  teamWins: z.number().int().min(0).max(100).default(0),
  displayOrder: z.number().int().min(0).max(500).default(0),
});

export const TournamentTeamInputSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  description: z.string().max(800).nullable().optional(),
  logoImage: z.string().max(300).nullable().optional(),
  logoAlt: z.string().max(160).nullable().optional(),
  displayOrder: z.number().int().min(0).max(500).default(0),
  participantIds: z.array(z.string().min(1)).max(8).default([]),
});

export const TournamentScheduleItemInputSchema = z.object({
  dayLabel: z.string().min(2).max(80).trim(),
  startsAt: z.string().nullable().optional(),
  timeLabel: z.string().max(80).nullable().optional(),
  title: z.string().min(2).max(140).trim(),
  details: z.string().max(500).nullable().optional(),
  displayOrder: z.number().int().min(0).max(500).default(0),
});

export const TournamentScoreHoleInputSchema = z.object({
  holeNumber: z.number().int().min(1).max(18),
  par: z.number().int().min(3).max(6),
  strokes: z.number().int().min(1).max(15),
  putts: z.number().int().min(0).max(8).nullable().optional(),
});

export const TournamentScoreInputSchema = z.object({
  editionCourseId: z.string().min(1).nullable().optional(),
  participantId: z.string().min(1),
  roundId: z.string().min(1).nullable().optional(),
  playedAt: z.string().nullable().optional(),
  grossStrokes: z.number().int().min(20).max(250).nullable().optional(),
  totalPar: z.number().int().min(20).max(120).nullable().optional(),
  handicapSnapshot: z.number().min(-10).max(60).nullable().optional(),
  courseHandicapSnapshot: z.number().int().min(-10).max(80).nullable().optional(),
  netStrokes: z.number().int().min(0).max(250).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  holes: z.array(TournamentScoreHoleInputSchema).max(18).optional(),
});

export type TournamentEditionInput = z.infer<typeof TournamentEditionInputSchema>;
export type TournamentEditionCourseInput = z.infer<typeof TournamentEditionCourseInputSchema>;
export type TournamentParticipantInput = z.infer<typeof TournamentParticipantInputSchema>;
export type TournamentTeamInput = z.infer<typeof TournamentTeamInputSchema>;
export type TournamentScheduleItemInput = z.infer<typeof TournamentScheduleItemInputSchema>;
export type TournamentScoreInput = z.infer<typeof TournamentScoreInputSchema>;
export type TournamentScoreHoleInput = z.infer<typeof TournamentScoreHoleInputSchema>;

export const AuthSignupInputSchema = z.object({
  name: z.string().min(2).max(80).trim(),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
  inviteCode: z.string().min(1).max(100),
});

export const AuthLoginInputSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
});

export const ProfileInputSchema = z.object({
  name: z.string().min(2).max(80).trim(),
});

export const AnthropicKeyInputSchema = z.object({
  apiKey: z.string().trim().min(20).max(300).refine((value) => value.startsWith("sk-ant-"), {
    message: "Claude API keys start with sk-ant-",
  }),
});

export type AuthSignupInput = z.infer<typeof AuthSignupInputSchema>;
export type AuthLoginInput = z.infer<typeof AuthLoginInputSchema>;
export type ProfileInput = z.infer<typeof ProfileInputSchema>;
export type AnthropicKeyInput = z.infer<typeof AnthropicKeyInputSchema>;

export function parsePars(pars: string): number[] {
  return pars.split(",").map((p) => Number(p.trim()));
}

export function formatPars(pars: number[]): string {
  return pars.join(",");
}
