import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAuthResponse, requireAdminApiUser, requireApiUser } from "@/lib/auth-utils";
import { TournamentEditionInputSchema } from "@/lib/types";
import { TITS_OPEN_SLUG, tournamentEditionInclude } from "@/lib/tournaments";

const TournamentCreateInputSchema = TournamentEditionInputSchema.extend({
  year: z.number().int().min(1900).max(2200),
});

export async function GET() {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const editions = await prisma.tournamentEdition.findMany({
    where: { series: { slug: TITS_OPEN_SLUG } },
    include: tournamentEditionInclude,
    orderBy: { year: "desc" },
  });
  return NextResponse.json(editions);
}

export async function POST(req: Request) {
  const user = await requireAdminApiUser();
  if (isAuthResponse(user)) return user;

  const body = await req.json().catch(() => null);
  const parsed = TournamentCreateInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tournament edition" }, { status: 400 });
  }

  const series = await prisma.tournamentSeries.upsert({
    where: { slug: TITS_OPEN_SLUG },
    update: {},
    create: { slug: TITS_OPEN_SLUG, name: "Tits Open" },
  });
  const data = parsed.data;
  const edition = await prisma.tournamentEdition.create({
    data: {
      seriesId: series.id,
      year: data.year,
      title: data.title ?? `Tits Open ${data.year}`,
      subtitle: data.subtitle ?? null,
      location: data.location ?? null,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      status: data.status ?? "PLANNED",
      layoutKey: data.layoutKey ?? `tits-open-${data.year}`,
      heroImage: data.heroImage ?? null,
      logoImage: data.logoImage ?? null,
      accentColor: data.accentColor ?? null,
    },
    include: tournamentEditionInclude,
  });

  return NextResponse.json(edition, { status: 201 });
}
