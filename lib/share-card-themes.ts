/**
 * Visual themes for the round share card.
 * Used by the next/og ImageResponse renderer. Three themes that rotate
 * deterministically per round id.
 */

export const SHARE_CARD_THEMES = ["sunrise", "twilight", "bunker"] as const;
export type ShareCardTheme = (typeof SHARE_CARD_THEMES)[number];

export type ThemeColors = {
  /** CSS `background` value applied to the root container (gradient OK). */
  background: string;
  /** Body text / primary foreground color. */
  text: string;
  /** Slightly muted variant for sublines + labels. */
  textMuted: string;
  /** Color of the big score numeral. */
  scoreText: string;
  /** Drop-shadow color behind the score, for legibility on light backgrounds. */
  scoreShadow: string;
  /** Hero card overlay (the container holding the data). */
  card: string;
  /** Border for the hero card / pills. */
  cardBorder: string;
  /** Accent color (the green-ish brand color in this theme). */
  accent: string;
  /** "Good" tone for under/even par (usually green). */
  good: string;
  /** "Warn" tone for small over par (amber). */
  warn: string;
  /** "Bad" tone for blow-up rounds (red). */
  bad: string;
};

export type ThemeMeta = {
  id: ShareCardTheme;
  label: string;
  colors: ThemeColors;
};

export const THEMES: Record<ShareCardTheme, ThemeMeta> = {
  sunrise: {
    id: "sunrise",
    label: "Sunrise tee",
    colors: {
      background:
        "linear-gradient(180deg, #f8c875 0%, #f8c875 18%, #fb923c 28%, #2f7a4d 62%, #1f5d3a 100%)",
      text: "#0f2014",
      textMuted: "rgba(15, 32, 20, 0.72)",
      scoreText: "#fef9ec",
      scoreShadow: "rgba(15, 32, 20, 0.42)",
      card: "rgba(15, 32, 20, 0.22)",
      cardBorder: "rgba(15, 32, 20, 0.32)",
      accent: "#fef9ec",
      good: "#bef264",
      warn: "#fed7aa",
      bad: "#fecaca",
    },
  },
  twilight: {
    id: "twilight",
    label: "Twilight pin",
    colors: {
      // Satori has flaky support for the modern `radial-gradient(size at position, …)`
      // syntax — use a linear-gradient that still reads as a twilight sky.
      background:
        "linear-gradient(180deg, #14483b 0%, #0c2f29 55%, #072018 100%)",
      text: "#e8fff4",
      textMuted: "rgba(232, 255, 244, 0.66)",
      scoreText: "#a5e8c9",
      scoreShadow: "rgba(0, 0, 0, 0.55)",
      card: "rgba(255, 255, 255, 0.05)",
      cardBorder: "rgba(165, 232, 201, 0.22)",
      accent: "#a5e8c9",
      good: "#a5e8c9",
      warn: "#fde68a",
      bad: "#fca5a5",
    },
  },
  bunker: {
    id: "bunker",
    label: "Bunker fade",
    colors: {
      background:
        "linear-gradient(180deg, #efe0bb 0%, #e7d3a8 22%, #c8ce9b 52%, #6e9b6f 78%, #274d36 100%)",
      text: "#1d2e1f",
      textMuted: "rgba(29, 46, 31, 0.66)",
      scoreText: "#fdfbf1",
      scoreShadow: "rgba(29, 46, 31, 0.42)",
      card: "rgba(29, 46, 31, 0.18)",
      cardBorder: "rgba(29, 46, 31, 0.28)",
      accent: "#fdfbf1",
      good: "#86efac",
      warn: "#fcd34d",
      bad: "#fca5a5",
    },
  },
};

/**
 * Deterministic theme pick keyed on round id, so re-shares of the same round
 * produce the same image. FNV-1a-ish small hash; cryptographic strength not
 * needed.
 */
export function pickThemeForRound(roundId: string): ShareCardTheme {
  let hash = 0;
  for (let i = 0; i < roundId.length; i++) {
    hash = (hash * 31 + roundId.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % SHARE_CARD_THEMES.length;
  return SHARE_CARD_THEMES[idx];
}

export function isShareCardTheme(value: unknown): value is ShareCardTheme {
  return (
    typeof value === "string" &&
    (SHARE_CARD_THEMES as readonly string[]).includes(value)
  );
}
