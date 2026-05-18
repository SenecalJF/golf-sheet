import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CourseInputSchema } from "@/lib/types";

export async function GET() {
  const courses = await prisma.course.findMany({
    include: { tees: true, _count: { select: { rounds: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(courses);
}

export async function POST(req: Request) {
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
