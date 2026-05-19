import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isAdmin: boolean;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api
    .getSession({
      headers: await headers(),
    })
    .catch(() => null);

  if (!session?.user) return null;
  const user = session.user as typeof session.user & { isAdmin?: boolean };
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    isAdmin: user.isAdmin ?? false,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireApiUser(): Promise<CurrentUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export function isAuthResponse(value: CurrentUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
