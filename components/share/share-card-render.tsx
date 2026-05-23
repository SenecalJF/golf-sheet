import "server-only";
import * as React from "react";

import type { ShareCardStats } from "@/lib/share-card-stats";
import { THEMES, type ShareCardTheme, type ThemeColors } from "@/lib/share-card-themes";

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
  backgroundImageDataUrl,
}: {
  stats: ShareCardStats;
  theme: ShareCardTheme;
  size: ShareCardSize;
  backgroundImageDataUrl?: string;
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

  const scoreSize = isStory ? 320 : 240;

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
      {backgroundImageDataUrl ? (
        <PhotoBackground src={backgroundImageDataUrl} colors={colors} dims={dims} />
      ) : (
        <ThemeDecorations theme={theme} colors={colors} dims={dims} />
      )}

      {/* Hero: course + city + date. */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: heroTitleSize,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            maxWidth: dims.width - 200,
            textShadow: `0 6px 24px ${colors.scoreShadow}`,
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
            textShadow: `0 4px 18px ${colors.scoreShadow}`,
          }}
        >
          <span>{`${stats.city} · ${stats.dateLabel} · ${stats.holeCount} holes${stats.nineLabel ? ` · ${stats.nineLabel}` : ""}`}</span>
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
          marginTop: isStory ? 96 : 42,
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
              display: "flex",
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
              display: "flex",
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
              display: "flex",
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
        </div>
      </div>

      {/* Stat strip — front/back or 9-hole equivalent. */}
      <StatStrip stats={stats} colors={colors} isStory={isStory} />

      <ScoreBreakdownRow stats={stats} colors={colors} isStory={isStory} />

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
              display: "flex",
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
  colors: ThemeColors;
  isStory: boolean;
}) {
  const blocks: { label: string; value: string }[] = [];

  if (stats.holeCount === 18) {
    blocks.push({ label: "Front 9", value: String(stats.frontTotal ?? "—") });
    blocks.push({ label: "Back 9", value: String(stats.backTotal ?? "—") });
  } else {
    blocks.push({
      label: "Holes",
      value: stats.nineLabel ?? `${stats.holeCount}H`,
    });
    blocks.push({ label: "Net vs par", value: formatSigned(stats.overPar) });
  }

  return (
    <div
      style={{
        marginTop: isStory ? 88 : 44,
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
            padding: isStory ? "28px 12px" : "24px 10px",
            background: colors.card,
            border: `2px solid ${colors.cardBorder}`,
            borderRadius: 28,
          }}
        >
          <div
            style={{
              display: "flex",
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
              display: "flex",
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

function ScoreBreakdownRow({
  stats,
  colors,
  isStory,
}: {
  stats: ShareCardStats;
  colors: ThemeColors;
  isStory: boolean;
}) {
  const items = buildScoreBreakdownItems(stats);
  const compact = items.length > 4;

  return (
    <div
      style={{
        marginTop: isStory ? 48 : 34,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: compact ? 12 : 16,
        marginBottom: isStory ? 48 : 28,
      }}
    >
      {items.map((item) => {
        const tone = pickScoreBreakdownTone(item.tone, colors);
        return (
          <div
            key={item.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: compact ? "16px 8px" : "18px 12px",
              borderRadius: 28,
              background: tone.background,
              border: `2px solid ${tone.border}`,
              color: tone.text,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: compact ? 40 : 46,
                fontWeight: 800,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {item.value}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 7,
                fontSize: compact ? 16 : 18,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                opacity: 0.88,
              }}
            >
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type ScoreBreakdownItem = {
  label: string;
  value: number;
  tone: "great" | "good" | "warn" | "bad";
};

function buildScoreBreakdownItems(stats: ShareCardStats): ScoreBreakdownItem[] {
  const breakdown = stats.scoreBreakdown;
  const doublesOrWorse = breakdown.doubles + breakdown.triplesOrWorse;
  const items: ScoreBreakdownItem[] = [];

  if (breakdown.eaglesOrBetter > 0) {
    items.push({
      label: "Eagle+",
      value: breakdown.eaglesOrBetter,
      tone: "great",
    });
  }

  if (breakdown.birdies > 0) {
    items.push({
      label: pluralize(breakdown.birdies, "Birdie", "Birdies"),
      value: breakdown.birdies,
      tone: "great",
    });
  }

  items.push({
    label: pluralize(breakdown.pars, "Par", "Pars"),
    value: breakdown.pars,
    tone: "good",
  });

  items.push({
    label: pluralize(breakdown.bogeys, "Bogey", "Bogeys"),
    value: breakdown.bogeys,
    tone: "warn",
  });

  if (breakdown.birdies === 0) {
    items.push({
      label: pluralize(breakdown.doubles, "Double", "Doubles"),
      value: breakdown.doubles,
      tone: "bad",
    });
    items.push({
      label: "Triples+",
      value: breakdown.triplesOrWorse,
      tone: "bad",
    });
  } else {
    items.push({
      label: "Doubles+",
      value: doublesOrWorse,
      tone: "bad",
    });
  }

  return items;
}

function pickScoreBreakdownTone(
  tone: ScoreBreakdownItem["tone"],
  colors: ThemeColors,
) {
  switch (tone) {
    case "great":
      return {
        background: `${colors.good}24`,
        text: colors.good,
        border: `${colors.good}78`,
      };
    case "good":
      return {
        background: colors.card,
        text: colors.text,
        border: colors.cardBorder,
      };
    case "warn":
      return {
        background: `${colors.warn}22`,
        text: colors.warn,
        border: `${colors.warn}66`,
      };
    case "bad":
      return {
        background: `${colors.bad}1f`,
        text: colors.bad,
        border: `${colors.bad}5c`,
      };
  }
}

function ThemeDecorations({
  theme,
  colors,
  dims,
}: {
  theme: ShareCardTheme;
  colors: ThemeColors;
  dims: { width: number; height: number };
}) {
  // Satori does not reliably support SVG <pattern>, <mask>, or <filter> elements,
  // and it can choke on the `inset: 0` shorthand. So every decoration here is a
  // single absolutely-positioned div wrapping a single primitive SVG with
  // explicit position offsets.
  const isStory = dims.height > dims.width;

  if (theme === "sunrise") {
    return (
      <div
        style={{
          position: "absolute",
          right: isStory ? -40 : -260,
          bottom: isStory ? -80 : -360,
          opacity: isStory ? 0.55 : 0.3,
          display: "flex",
        }}
      >
        <svg width="520" height="780" viewBox="0 0 520 780">
          <rect x="240" y="80" width="14" height="640" rx="6" fill="#fef3c7" />
          <path
            d="M254 80 L450 130 L254 200 Z"
            fill="#fbbf24"
            stroke="#92400e"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <ellipse cx="247" cy="730" rx="80" ry="20" fill="#0f2014" opacity="0.22" />
        </svg>
      </div>
    );
  }

  if (theme === "twilight") {
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
        }}
      >
        <svg width={dims.width} height={dims.height} viewBox={`0 0 ${dims.width} ${dims.height}`}>
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
          <line
            x1="80"
            y1={isStory ? dims.height - 360 : dims.height - 92}
            x2={dims.width - 80}
            y2={isStory ? dims.height - 360 : dims.height - 92}
            stroke={colors.accent}
            strokeWidth="2"
            opacity="0.18"
          />
        </svg>
      </div>
    );
  }

  // bunker
  return (
      <div
        style={{
          position: "absolute",
          left: isStory ? -120 : -260,
          bottom: isStory ? -160 : -330,
          display: "flex",
          opacity: isStory ? 0.55 : 0.35,
        }}
      >
      <svg width="640" height="500" viewBox="0 0 640 500">
        <path
          d="M40 460 Q40 200 320 200 Q600 200 600 460"
          stroke="#1d2e1f"
          strokeWidth="10"
          fill="#e7d3a8"
          fillOpacity="0.55"
        />
        <ellipse cx="320" cy="120" rx="30" ry="30" fill="#fdfbf1" stroke="#1d2e1f" strokeWidth="6" />
      </svg>
    </div>
  );
}

function PhotoBackground({
  src,
  colors,
  dims,
}: {
  src: string;
  colors: ThemeColors;
  dims: { width: number; height: number };
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: dims.width,
        height: dims.height,
        display: "flex",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- next/image cannot render inside ImageResponse. */}
      <img
        src={src}
        width={dims.width}
        height={dims.height}
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: dims.width,
          height: dims.height,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: dims.width,
          height: dims.height,
          background: colors.photoOverlay,
        }}
      />
    </div>
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
  ThemeColors,
  "good" | "warn" | "bad" | "card" | "cardBorder" | "text" | "textMuted" | "accent"
>;

function formatSigned(value: number): string {
  if (value > 0) return `+${value}`;
  if (value === 0) return "E";
  return String(value);
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
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
