import { NextResponse } from "next/server";
import { isAuthResponse, requireApiUser } from "@/lib/auth-utils";
import { getPendingRoundSummariesForUser } from "@/lib/data";

export async function GET() {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const rounds = await getPendingRoundSummariesForUser(user.id);
  return NextResponse.json(rounds);
}
