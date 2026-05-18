import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { getAnthropic, MODELS, type ModelKey } from "@/lib/anthropic";
import { SCORECARD_SYSTEM_PROMPT, buildHintsText } from "@/lib/scorecard-prompt";
import { ExtractedScorecardSchema, parsePars } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  const expectedParsRaw = form.get("expectedPars");
  const preferredHoleCount = form.get("preferredHoleCount");
  const modelKey = (form.get("model") as ModelKey | null) ?? "default";
  const model = MODELS[modelKey] ?? MODELS.default;

  let expectedPars: number[] | undefined;
  if (typeof expectedParsRaw === "string" && expectedParsRaw.length > 0) {
    try {
      expectedPars = parsePars(expectedParsRaw);
    } catch {
      // ignore bad hint
    }
  }

  // Save original image to public/uploads in local dev so the round-detail
  // page can show it. On Vercel the serverless filesystem isn't writable, so
  // we skip persistence and only pass the bytes to the AI in-memory.
  const buf = Buffer.from(await file.arrayBuffer());
  const isServerless = !!process.env.VERCEL;
  let savedPath: string | null = null;
  if (!isServerless) {
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const filename = `${randomUUID()}.${ext}`;
      const fullPath = path.join(uploadDir, filename);
      await fs.writeFile(fullPath, buf);
      savedPath = `/uploads/${filename}`;
    } catch {
      savedPath = null;
    }
  }

  // For the AI: downscale to max 1600 on the long edge, convert to JPEG
  const resized = await sharp(buf)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer();
  const base64 = resized.toString("base64");

  const hintsText = buildHintsText({
    expectedPars,
    preferredHoleCount:
      preferredHoleCount === "9" || preferredHoleCount === "18"
        ? (Number(preferredHoleCount) as 9 | 18)
        : undefined,
  });

  let anthropic;
  try {
    anthropic = getAnthropic();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Anthropic not configured" },
      { status: 503 },
    );
  }

  const start = Date.now();
  let resp;
  try {
    resp = await anthropic.messages.create({
      model,
      max_tokens: 2000,
      system: [
        {
          type: "text",
          text: SCORECARD_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: base64 },
            },
            { type: "text", text: hintsText },
          ],
        },
      ],
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI extraction failed" },
      { status: 502 },
    );
  }

  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No text in AI response" }, { status: 502 });
  }
  const raw = textBlock.text.trim();
  const jsonStr = raw.startsWith("```")
    ? raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim()
    : raw;

  let parsed;
  try {
    parsed = ExtractedScorecardSchema.parse(JSON.parse(jsonStr));
  } catch (e) {
    return NextResponse.json(
      {
        error: "AI returned malformed JSON",
        raw: raw.slice(0, 800),
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    extraction: parsed,
    imagePath: savedPath,
    model,
    durationMs: Date.now() - start,
    usage: resp.usage,
  });
}
