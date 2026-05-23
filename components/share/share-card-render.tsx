import "server-only";
import * as React from "react";

import type { ShareCardStats } from "@/lib/share-card-stats";
import { THEMES, type ShareCardTheme } from "@/lib/share-card-themes";

const FONT_STACK =
  '"Inter", "SF Pro Text", "Helvetica Neue", "Arial", sans-serif';

export type ShareCardSize = "story" | "square";

export const SHARE_CARD_DIMENSIONS: Record<ShareCardSize, { width: number; height: number }> =
  {
    story: { width: 1080, height: 1920 },
    square: { width: 1080, height: 1080 },
  };

/**
 * The renderer returns a single React element. next/og's `ImageResponse` will
 * call into Satori with this tree. Satori only supports a flexbox subset and
 * a small set of CSS properties, so styles are inline and intentionally
 * conservative.
 */
export function renderShareCard({
  stats,
  theme,
  size,
}: {
  stats: ShareCardStats;
  theme: ShareCardTheme;
  size: ShareCardSize;
}): React.ReactElement {
  const meta = THEMES[theme];
  const dims = SHARE_CARD_DIMENSIONS[size];
  const colors = meta.colors;
  const isStory = size === "story";

  const overParTone = pickOverParTone(stats.overPar, colors);
  const overParLabel = formatSigned(stats.overPar);

  const heroTitleSize = isStory
    ? clampFontSize(stats.courseName, [76, 64, 56])
    : clampFontSize(stats.courseName, [64, 56, 48]);

  const scoreSize = isStory ? 320 : 260;

  return (
    <div
      style={{
        position: "relative",
        width: dims.width,
        height: dims.height,
        display: "flex",
        flexDirection: "column",
        background: colors.background,
        color: colors.text,
        fontFamily: FONT_STACK,
        padding: isStory ? "96px 80px 80px" : "72px 72px 64px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Theme-specific decorations behind everything. */}
      <ThemeDecorations theme={theme} colors={colors} dims={dims} />

      {/* Hero: course + city + date. */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: heroTitleSize,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            maxWidth: dims.width - 200,
          }}
        >
          {stats.courseName}
        </div>
        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            fontSize: 32,
            color: colors.textMuted,
          }}
        >
          <span>{stats.city}</span>
          <span>·</span>
          <span>{stats.dateLabel}</span>
          <span>·</span>
          <span>
            {stats.holeCount} holes
            {stats.nineLabel ? ` · ${stats.nineLabel}` : ""}
          </span>
        </div>
        <div
          style={{
            marginTop: 28,
            width: 120,
            height: 6,
            borderRadius: 999,
            background: colors.accent,
            opacity: 0.85,
          }}
        />
      </div>

      {/* Score block — big numeral + vs par pill. */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 56,
          marginTop: isStory ? 96 : 56,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 24,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: colors.textMuted,
              marginBottom: 12,
            }}
          >
            Score
          </div>
          <div
            style={{
              fontSize: scoreSize,
              fontWeight: 900,
              lineHeight: 0.9,
              color: colors.scoreText,
              textShadow: `0 10px 30px ${colors.scoreShadow}`,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.04em",
            }}
          >
            {stats.totalStrokes}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 30,
              color: colors.textMuted,
            }}
          >
            par {stats.totalPar}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            minWidth: 240,
          }}
        >
          <Pill
            background={overParTone.background}
            color={overParTone.text}
            border={overParTone.border}
            size={isStory ? "lg" : "md"}
          >
            <span style={{ fontWeight: 800, fontSize: isStory ? 64 : 52 }}>
              {overParLabel}
            </span>
            <span
              style={{
                fontSize: 24,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                opacity: 0.85,
              }}
            >
              vs par
            </span>
          </Pill>
          {stats.scoreDiff != null && (
            <Pill
              background={colors.card}
              color={colors.text}
              border={colors.cardBorder}
              size="md"
            >
              <span style={{ fontWeight: 800, fontSize: 40 }}>
                {stats.scoreDiff.toFixed(1)}
              </span>
              <span
                style={{
                  fontSize: 22,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  opacity: 0.78,
                }}
              >
                differential
              </span>
            </Pill>
          )}
        </div>
      </div>

      {/* Stat strip — front/back/diff or 9-hole equivalent. */}
      <StatStrip stats={stats} colors={colors} isStory={isStory} />

      {/* Par-type row. */}
      <ParTypeRow stats={stats} colors={colors} />

      {/* Footer: owner + brand. */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 28,
          color: colors.textMuted,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
          <span
            style={{
              display: "inline-flex",
              width: 12,
              height: 12,
              borderRadius: 999,
              background: colors.accent,
            }}
          />
          <span style={{ color: colors.text, fontWeight: 700 }}>
            {stats.userName ?? "A golfer"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
          <span>⛳</span>
          <span style={{ fontWeight: 700, color: colors.text }}>Golf Sheet</span>
        </div>
      </div>
    </div>
  );
}

function StatStrip({
  stats,
  colors,
  isStory,
}: {
  stats: ShareCardStats;
  colors: ReturnType<typeof getColors>;
  isStory: boolean;
}) {
  const blocks: { label: string; value: string }[] = [];

  if (stats.holeCount === 18) {
    blocks.push({ label: "Front 9", value: String(stats.frontTotal ?? "—") });
    blocks.push({ label: "Back 9", value: String(stats.backTotal ?? "—") });
    if (stats.scoreDiff != null) {
      blocks.push({ label: "Differential", value: stats.scoreDiff.toFixed(1) });
    } else if (stats.bestHoleOverPar != null) {
      blocks.push({
        label: "Best hole",
        value: formatSigned(stats.bestHoleOverPar),
      });
    }
  } else {
    blocks.push({
      label: "Holes",
      value: stats.nineLabel ?? `${stats.holeCount}H`,
    });
    blocks.push({ label: "Net vs par", value: formatSigned(stats.overPar) });
    if (stats.scoreDiff != null) {
      blocks.push({ label: "Differential", value: stats.scoreDiff.toFixed(1) });
    } else if (stats.bestHoleOverPar != null) {
      blocks.push({
        label: "Best hole",
        value: formatSigned(stats.bestHoleOverPar),
      });
    }
  }

  return (
    <div
      style={{
        marginTop: isStory ? 88 : 56,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 18,
      }}
    >
      {blocks.map((block) => (
        <div
          key={block.label}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "28px 12px",
            background: colors.card,
            border: `2px solid ${colors.cardBorder}`,
            borderRadius: 28,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: colors.text,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}
          >
            {block.value}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 22,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: colors.textMuted,
            }}
          >
            {block.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function ParTypeRow({
  stats,
  colors,
}: {
  stats: ShareCardStats;
  colors: ReturnType<typeof getColors>;
}) {
  const items: { label: string; avg: number | null }[] = [
    { label: "Par 3", avg: stats.parTypeAverages.par3 },
    { label: "Par 4", avg: stats.parTypeAverages.par4 },
    { label: "Par 5", avg: stats.parTypeAverages.par5 },
  ];

  return (
    <div
      style={{
        marginTop: 48,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      {items.map((item) => {
        const tone = item.avg == null ? null : pickOverParTone(item.avg, colors);
        return (
          <div
            key={item.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              padding: "20px 16px",
              borderRadius: 999,
              background: tone?.background ?? colors.card,
              border: `2px solid ${tone?.border ?? colors.cardBorder}`,
              color: tone?.text ?? colors.text,
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            <span style={{ opacity: 0.85 }}>{item.label}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {item.avg == null ? "—" : formatSignedDecimal(item.avg)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ThemeDecorations({
  theme,
  colors,
  dims,
}: {
  theme: ShareCardTheme;
  colors: ReturnType<typeof getColors>;
  dims: { width: number; height: number };
}) {
  // All decorations are absolutely positioned behind content via z-index ordering.
  if (theme === "sunrise") {
    return (
      <>
        {/* Flagstick in the bottom-right. */}
        <div
          style={{
            position: "absolute",
            right: -40,
            bottom: -60,
            opacity: 0.6,
            display: "flex",
          }}
        >
          <svg width="520" height="780" viewBox="0 0 520 780" fill="none">
            <rect x="240" y="80" width="14" height="640" rx="6" fill="#fef3c7" />
            <path
              d="M254 80 L450 130 L254 200 Z"
              fill="#fbbf24"
              stroke="#92400e"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <ellipse cx="247" cy="730" rx="80" ry="20" fill="rgba(15,32,20,0.18)" />
          </svg>
        </div>
        {/* Subtle grass texture across the bottom third. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            opacity: 0.18,
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="none">
            <defs>
              <pattern id="blades" x="0" y="0" width="60" height="80" patternUnits="userSpaceOnUse">
                <path
                  d="M30 80 Q26 50 30 20 Q34 50 30 80 Z"
                  fill="#0f2014"
                  opacity="0.35"
                />
              </pattern>
            </defs>
            <rect x="0" y={dims.height * 0.65} width="1080" height={dims.height * 0.4} fill="url(#blades)" />
          </svg>
        </div>
      </>
    );
  }

  if (theme === "twilight") {
    return (
      <>
        {/* Constellation dots along the top. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="none">
            {CONSTELLATION_DOTS.map((dot, i) => (
              <circle
                key={i}
                cx={dot.x}
                cy={dot.y}
                r={dot.r}
                fill={colors.accent}
                opacity={dot.o}
              />
            ))}
          </svg>
        </div>
        {/* Horizon rule. */}
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            bottom: 360,
            height: 2,
            background: colors.accent,
            opacity: 0.18,
            display: "flex",
          }}
        />
      </>
    );
  }

  // bunker
  return (
    <>
      {/* Half-circle bunker outline in the bottom-left. */}
      <div
        style={{
          position: "absolute",
          left: -120,
          bottom: -160,
          display: "flex",
          opacity: 0.55,
        }}
      >
        <svg width="640" height="500" viewBox="0 0 640 500" fill="none">
          <path
            d="M40 460 Q40 200 320 200 Q600 200 600 460"
            stroke="#1d2e1f"
            strokeWidth="10"
            fill="rgba(231,211,168,0.55)"
          />
          <ellipse cx="320" cy="120" rx="30" ry="30" fill="#fdfbf1" stroke="#1d2e1f" strokeWidth="6" />
        </svg>
      </div>
      {/* Dot grain texture across the top sand band. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.18,
          display: "flex",
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="none">
          <defs>
            <pattern id="grain" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="6" cy="6" r="1.2" fill="#1d2e1f" />
              <circle cx="18" cy="14" r="0.8" fill="#1d2e1f" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="1080" height="720" fill="url(#grain)" />
        </svg>
      </div>
    </>
  );
}

function Pill({
  children,
  background,
  color,
  border,
  size,
}: {
  children: React.ReactNode;
  background: string;
  color: string;
  border: string;
  size: "md" | "lg";
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: size === "lg" ? "20px 32px" : "16px 24px",
        background,
        color,
        border: `3px solid ${border}`,
        borderRadius: 28,
        minWidth: size === "lg" ? 240 : 220,
      }}
    >
      {children}
    </div>
  );
}

function pickOverParTone(
  overPar: number,
  colors: ThemeColorsLike,
): { background: string; text: string; border: string } {
  if (overPar <= 0) {
    return {
      background: `${colors.good}20`,
      text: colors.good,
      border: `${colors.good}66`,
    };
  }
  if (overPar < 5) {
    return {
      background: `${colors.warn}22`,
      text: colors.warn,
      border: `${colors.warn}66`,
    };
  }
  return {
    background: `${colors.bad}22`,
    text: colors.bad,
    border: `${colors.bad}66`,
  };
}

type ThemeColorsLike = Pick<
  ReturnType<typeof getColors>,
  "good" | "warn" | "bad" | "card" | "cardBorder" | "text" | "textMuted" | "accent"
>;

function getColors(theme: ShareCardTheme) {
  return THEMES[theme].colors;
}

function formatSigned(value: number): string {
  if (value > 0) return `+${value}`;
  if (value === 0) return "E";
  return String(value);
}

function formatSignedDecimal(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) return "0.00";
  if (rounded > 0) return `+${rounded.toFixed(2)}`;
  return rounded.toFixed(2);
}

function clampFontSize(text: string, sizes: number[]): number {
  if (sizes.length === 0) return 64;
  if (text.length < 22) return sizes[0];
  if (text.length < 32) return sizes[1] ?? sizes[0];
  return sizes[sizes.length - 1];
}

// Hand-picked positions so it doesn't look like a random scatter.
const CONSTELLATION_DOTS: { x: number; y: number; r: number; o: number }[] = [
  { x: 120, y: 140, r: 6, o: 0.55 },
  { x: 240, y: 80, r: 4, o: 0.35 },
  { x: 360, y: 180, r: 5, o: 0.45 },
  { x: 520, y: 110, r: 3, o: 0.4 },
  { x: 660, y: 200, r: 6, o: 0.55 },
  { x: 820, y: 130, r: 5, o: 0.45 },
  { x: 960, y: 220, r: 4, o: 0.35 },
  { x: 200, y: 280, r: 3, o: 0.25 },
  { x: 720, y: 320, r: 4, o: 0.3 },
];
