import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireApiUser } from "@/lib/auth-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({
      where: { recipientId: user.id, readAt: null },
    }),
    prisma.notification.findMany({
      where: { recipientId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({ unreadCount, notifications });
}
