import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CourseInputSchema } from "@/lib/types";
import { isAuthResponse, requireApiUser } from "@/lib/auth-utils";

export async function GET() {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const courses = await prisma.course.findMany({
    include: { tees: true, _count: { select: { rounds: { where: { userId: user.id } } } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(courses);
}

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isAuthResponse(user)) return user;

  const body = await req.json();
  const parsed = CourseInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const created = await prisma.course.create({
      data: {
        name: parsed.data.name,
        city: parsed.data.city,
        province: parsed.data.province ?? "QC",
        notes: parsed.data.notes ?? null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create course";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
