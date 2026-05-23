import { NextResponse } from "next/server";
import { ImageResponse } from "next/og";

import { prisma } from "@/lib/db";
import { isAuthResponse, requireApiUser } from "@/lib/auth-utils";
import { getShareCardBackgroundDataUrl } from "@/lib/share-card-backgrounds";
import { buildShareCardStats } from "@/lib/share-card-stats";
import {
  isShareCardTheme,
  pickThemeForRound,
  type ShareCardTheme,
} from "@/lib/share-card-themes";
import {
  renderShareCard,
  SHARE_CARD_DIMENSIONS,
  type ShareCardSize,
} from "@/components/share/share-card-render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

type StepName =
  | "auth"
  | "params"
  | "prisma"
  | "buildStats"
  | "background"
  | "renderJsx"
  | "imageResponse";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let lastStep: StepName = "auth";
  try {
    // Step 1 — auth.
    const user = await requireApiUser();
    if (isAuthResponse(user)) return user;

    // Step 2 — params + query.
    lastStep = "params";
    const { id } = await params;
    const url = new URL(req.url);
    const sizeParam = url.searchParams.get("size");
    const themeParam = url.searchParams.get("theme");
    const debug = url.searchParams.get("debug") === "1";

    const size: ShareCardSize = sizeParam === "square" ? "square" : "story";
    const dims = SHARE_CARD_DIMENSIONS[size];

    // Step 3 — load the round.
    lastStep = "prisma";
    const round = await prisma.round.findFirst({
      where: { id, userId: user.id },
      include: {
        course: true,
        tee: true,
        holes: { orderBy: { holeNumber: "asc" } },
        user: { select: { name: true } },
      },
    });
    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    const theme: ShareCardTheme = isShareCardTheme(themeParam)
      ? themeParam
      : pickThemeForRound(round.id);

    // Step 4 — build the structured payload.
    lastStep = "buildStats";
    const stats = buildShareCardStats(round, round.user?.name ?? null);

    // ?debug=1 short-circuit: dump the JSON instead of rendering an image. Lets
    // me isolate "is the data sane?" from "is Satori choking?"
    if (debug) {
      return NextResponse.json(
        { ok: true, theme, size, dims, stats },
        { status: 200 },
      );
    }

    // Step 5 — load the pre-cropped local photo background.
    lastStep = "background";
    const backgroundImageDataUrl = await getShareCardBackgroundDataUrl(
      theme,
      size,
    );

    // Step 6 — build the JSX tree.
    lastStep = "renderJsx";
    const element = renderShareCard({
      stats,
      theme,
      size,
      backgroundImageDataUrl,
    });

    // Step 7 — hand to ImageResponse. Errors that throw inside Satori during
    // body streaming bypass this try/catch, so we ALSO buffer here.
    lastStep = "imageResponse";
    return new ImageResponse(element, {
      width: dims.width,
      height: dims.height,
      headers: {
        "Cache-Control": "private, max-age=60",
        "X-Share-Card-Theme": theme,
        "X-Share-Card-Size": size,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    // Use console.error so the line is captured by Vercel's runtime log.
    console.error(`[share-card] failed at step=${lastStep}: ${message}`, {
      stack,
    });
    return NextResponse.json(
      { error: "Image generation failed", step: lastStep, detail: message },
      { status: 500 },
    );
  }
}
