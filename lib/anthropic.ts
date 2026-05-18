import Anthropic from "@anthropic-ai/sdk";

export const MODELS = {
  default: "claude-sonnet-4-6",
  hard: "claude-opus-4-7",
  insights: "claude-sonnet-4-6",
} as const;

export type ModelKey = keyof typeof MODELS;

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable AI features.",
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
