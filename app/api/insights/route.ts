import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MODELS } from "@/lib/anthropic";
import { buildDifferentialsAndIndex } from "@/lib/handicap";
import {
  buildTrend,
  parTypeBreakdown,
  holeHeatmap,
  perCourseSummary,
  type RoundFull,
} from "@/lib/stats";
import { isAuthResponse, requireApiUser } from "@/lib/auth-utils";
import { getAnthropicForUser } from "@/lib/user-secrets";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const INSIGHTS_SYSTEM = `You are a concise, sharp golf coach reviewing a player's recent rounds.
- Lead with the 2 most actionable patterns you see (strengths and weaknesses).
- Cite specific numbers from the data (avg vs par, hole numbers, course names).
- Keep total length under 180 words.
- Output plain text, no markdown headers, no JSON.
- End with one specific practice suggestion.`;

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const { courseId } = await req.json().catch(() => ({ courseId: null }));

  const rounds: RoundFull[] = await prisma.round.findMany({
    where: courseId
      ? { userId: user.id, courseId, excludeFromStats: false }
      : { userId: user.id, excludeFromStats: false },
    include: { course: true, tee: true, holes: { orderBy: { holeNumber: "asc" } } },
    orderBy: { date: "desc" },
  });

  if (rounds.length < 5) {
    return NextResponse.json(
      { error: "Need at least 5 rounds for insights" },
      { status: 400 },
    );
  }

  const trend = buildTrend(rounds).slice(-20);
  const par = parTypeBreakdown(rounds);
  const heat = holeHeatmap(rounds);
  const perCourse = perCourseSummary(rounds);
  const scoring = rounds.map((r) => ({
    id: r.id,
    date: r.date,
    holeCount: r.holeCount as 9 | 18,
    nineType: (r.nineType ?? null) as "front" | "back" | null,
    totalStrokes: r.totalStrokes,
    pars: r.holes.map((h) => h.par),
    holeStrokes: r.holes.map((h) => h.strokes),
    rating: r.tee?.rating ?? null,
    slope: r.tee?.slope ?? null,
    pcc: r.pcc,
  }));
  const { index } = buildDifferentialsAndIndex(scoring);

  const summaryPayload = {
    handicapIndex: index,
    rounds: rounds.length,
    recent: trend,
    parTypes: par,
    perCourse,
    worstHoles: [...heat].sort((a, b) => b.avgVsPar - a.avgVsPar).slice(0, 4),
    bestHoles: [...heat].sort((a, b) => a.avgVsPar - b.avgVsPar).slice(0, 4),
  };

  let anthropic;
  try {
    anthropic = await getAnthropicForUser(user.id);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI not configured" },
      { status: 503 },
    );
  }

  let resp;
  try {
    resp = await anthropic.messages.create({
      model: MODELS.insights,
      max_tokens: 600,
      system: [
        { type: "text", text: INSIGHTS_SYSTEM, cache_control: { type: "ephemeral" } },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Player stats (JSON):\n${JSON.stringify(summaryPayload, null, 2)}\n\nWrite the insight summary now.`,
            },
          ],
        },
      ],
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI insights failed" },
      { status: 502 },
    );
  }
  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No text in AI response" }, { status: 502 });
  }
  return NextResponse.json({ summary: textBlock.text.trim() });
}
