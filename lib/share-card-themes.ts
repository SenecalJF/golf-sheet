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
  /** Readability overlay applied over the photo background. */
  photoOverlay: string;
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
        "linear-gradient(180deg, #22351f 0%, #0f2b1e 58%, #07170f 100%)",
      photoOverlay:
        "linear-gradient(180deg, rgba(6, 18, 14, 0.34) 0%, rgba(6, 18, 14, 0.62) 48%, rgba(6, 18, 14, 0.9) 100%)",
      text: "#fff8e7",
      textMuted: "rgba(255, 248, 231, 0.76)",
      scoreText: "#fff8e7",
      scoreShadow: "rgba(0, 0, 0, 0.58)",
      card: "rgba(6, 18, 14, 0.54)",
      cardBorder: "rgba(255, 248, 231, 0.28)",
      accent: "#f6c76c",
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
        "linear-gradient(180deg, #12362f 0%, #08231f 58%, #04130f 100%)",
      photoOverlay:
        "linear-gradient(180deg, rgba(5, 17, 24, 0.5) 0%, rgba(5, 17, 24, 0.72) 52%, rgba(5, 17, 24, 0.92) 100%)",
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
        "linear-gradient(180deg, #2a3422 0%, #142719 58%, #07170f 100%)",
      photoOverlay:
        "linear-gradient(180deg, rgba(18, 24, 13, 0.32) 0%, rgba(18, 24, 13, 0.62) 48%, rgba(18, 24, 13, 0.9) 100%)",
      text: "#fff8e7",
      textMuted: "rgba(255, 248, 231, 0.72)",
      scoreText: "#fff8e7",
      scoreShadow: "rgba(0, 0, 0, 0.56)",
      card: "rgba(18, 24, 13, 0.52)",
      cardBorder: "rgba(255, 248, 231, 0.26)",
      accent: "#d8c28a",
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
