import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireAdminApiUser, requireApiUser } from "@/lib/auth-utils";
import { TournamentEditionInputSchema } from "@/lib/types";
import { parseNullableDate, tournamentEditionInclude } from "@/lib/tournaments";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ editionId: string }> },
) {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId } = await params;
  const edition = await prisma.tournamentEdition.findUnique({
    where: { id: editionId },
    include: tournamentEditionInclude,
  });
  if (!edition) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  return NextResponse.json(edition);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ editionId: string }> },
) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const { editionId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = TournamentEditionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const edition = await prisma.tournamentEdition.update({
    where: { id: editionId },
    data: {
      title: data.title,
      subtitle: data.subtitle,
      location: data.location,
      startsAt: data.startsAt === undefined ? undefined : parseNullableDate(data.startsAt),
      endsAt: data.endsAt === undefined ? undefined : parseNullableDate(data.endsAt),
      status: data.status,
      layoutKey: data.layoutKey,
      heroImage: data.heroImage,
      logoImage: data.logoImage,
      accentColor: data.accentColor,
    },
    include: tournamentEditionInclude,
  });
  return NextResponse.json(edition);
}
