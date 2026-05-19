import { NextResponse } from "next/server";
import { requireApiUser, isAuthResponse } from "@/lib/auth-utils";
import {
  deleteAnthropicKey,
  getAnthropicKeyStatus,
  saveAnthropicKey,
  testAnthropicKey,
} from "@/lib/user-secrets";
import { AnthropicKeyInputSchema } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const body = await req.json().catch(() => null);
  const parsed = AnthropicKeyInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await testAnthropicKey(parsed.data.apiKey);
    const url = new URL(req.url);
    if (url.searchParams.get("test") !== "1") {
      await saveAnthropicKey(user.id, parsed.data.apiKey);
    }
    return NextResponse.json(await getAnthropicKeyStatus(user.id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Claude key check failed" },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  await deleteAnthropicKey(user.id);
  return NextResponse.json(await getAnthropicKeyStatus(user.id));
}
