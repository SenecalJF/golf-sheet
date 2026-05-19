import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireApiUser } from "@/lib/auth-utils";
import { ProfileInputSchema } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const body = await req.json().catch(() => null);
  const parsed = ProfileInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
    select: { id: true, name: true, email: true, image: true },
  });

  return NextResponse.json(updated);
}
