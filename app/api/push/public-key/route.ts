import { NextResponse } from "next/server";
import { getWebPushPublicKey } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const publicKey = getWebPushPublicKey();
  return NextResponse.json({
    enabled: !!publicKey,
    publicKey,
  });
}
