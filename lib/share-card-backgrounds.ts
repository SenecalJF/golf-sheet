import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import type { ShareCardTheme } from "@/lib/share-card-themes";

type ShareCardBackgroundSize = "story" | "square";

const BACKGROUNDS: Record<
  ShareCardTheme,
  Record<ShareCardBackgroundSize, string>
> = {
  sunrise: {
    story: "sunrise-story.jpg",
    square: "sunrise-square.jpg",
  },
  twilight: {
    story: "twilight-story.jpg",
    square: "twilight-square.jpg",
  },
  bunker: {
    story: "bunker-story.jpg",
    square: "bunker-square.jpg",
  },
};

const dataUrlCache = new Map<string, Promise<string>>();

export function getShareCardBackgroundDataUrl(
  theme: ShareCardTheme,
  size: ShareCardBackgroundSize,
) {
  const fileName = BACKGROUNDS[theme][size];
  const cacheKey = `${theme}:${size}`;
  const cached = dataUrlCache.get(cacheKey);
  if (cached) return cached;

  const filePath = path.join(
    process.cwd(),
    "public",
    "share-card",
    "backgrounds",
    fileName,
  );
  const dataUrl = readFile(filePath).then(
    (buffer) => `data:image/jpeg;base64,${buffer.toString("base64")}`,
  );
  dataUrlCache.set(cacheKey, dataUrl);
  return dataUrl;
}
