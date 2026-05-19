import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { getAnthropic, MODELS, type ModelKey } from "@/lib/anthropic";
import { SCORECARD_SYSTEM_PROMPT, buildHintsText } from "@/lib/scorecard-prompt";
import { ExtractedScorecardSchema, parsePars } from "@/lib/types";

export const runtime = "nodejs";

const MAX_FILES = 6;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  // Accept either `files` (multiple) or legacy `file` (single)
  const rawFiles: File[] = [];
  for (const v of form.getAll("files")) {
    if (v instanceof File) rawFiles.push(v);
  }
  if (rawFiles.length === 0) {
    const legacy = form.get("file");
    if (legacy instanceof File) rawFiles.push(legacy);
  }
  if (rawFiles.length === 0) {
    return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
  }
  if (rawFiles.length > MAX_FILES) {
    return NextResponse.json(
      { error: `At most ${MAX_FILES} photos per scorecard` },
      { status: 400 },
    );
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

  // Local dev: persist originals to public/uploads so the round-detail page can show them.
  // Vercel: serverless FS isn't writable across requests — skip persistence.
  const isServerless = !!process.env.VERCEL;

  const savedPaths: string[] = [];
  const aiImagesBase64: string[] = [];

  for (const file of rawFiles) {
    const buf = Buffer.from(await file.arrayBuffer());

    if (!isServerless) {
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadDir, { recursive: true });
        const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
        const filename = `${randomUUID()}.${ext}`;
        const fullPath = path.join(uploadDir, filename);
        await fs.writeFile(fullPath, buf);
        savedPaths.push(`/uploads/${filename}`);
      } catch {
        // ignore
      }
    }

    const resized = await sharp(buf)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    aiImagesBase64.push(resized.toString("base64"));
  }

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
      max_tokens: 2500,
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
            ...aiImagesBase64.map(
              (data, idx) =>
                ({
                  type: "image" as const,
                  source: { type: "base64" as const, media_type: "image/jpeg" as const, data },
                  ...(aiImagesBase64.length > 1
                    ? { cache_control: undefined }
                    : {}),
                }) as never,
            ),
            {
              type: "text",
              text:
                aiImagesBase64.length > 1
                  ? `${aiImagesBase64.length} photos of the same scorecard. Merge them.\n\n${hintsText}`
                  : hintsText,
            },
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
    imagePaths: savedPaths,
    imagePath: savedPaths[0] ?? null, // legacy single-image field
    model,
    durationMs: Date.now() - start,
    usage: resp.usage,
  });
}
