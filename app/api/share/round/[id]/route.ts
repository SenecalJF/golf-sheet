import { NextResponse } from "next/server";
import { ImageResponse } from "next/og";

import { prisma } from "@/lib/db";
import { isAuthResponse, requireApiUser } from "@/lib/auth-utils";
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
// Rendering happens via Satori; usually 200-600ms, well under any platform
// limit. Cap conservatively for safety.
export const maxDuration = 15;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const { id } = await params;
  const url = new URL(req.url);
  const sizeParam = url.searchParams.get("size");
  const themeParam = url.searchParams.get("theme");

  const size: ShareCardSize = sizeParam === "square" ? "square" : "story";
  const dims = SHARE_CARD_DIMENSIONS[size];

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

  const stats = buildShareCardStats(round, round.user?.name ?? null);

  // Wrap the ImageResponse construction explicitly so any Satori failure
  // (e.g. unsupported CSS, malformed SVG) bubbles up with a useful log line
  // instead of the platform's silent 500.
  try {
    return new ImageResponse(renderShareCard({ stats, theme, size }), {
      width: dims.width,
      height: dims.height,
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("share-card render failed", {
      roundId: round.id,
      theme,
      size,
      message,
      stack,
    });
    return NextResponse.json(
      { error: "Image generation failed", detail: message },
      { status: 500 },
    );
  }
}
