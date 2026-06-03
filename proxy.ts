import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PAGES = new Set(["/login", "/signup", "/forgot-password", "/reset-password"]);
const GUEST_ONLY_PAGES = new Set(["/login", "/signup"]);
const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));
  const isPublicPage = PUBLIC_PAGES.has(pathname);
  const isGuestOnlyPage = GUEST_ONLY_PAGES.has(pathname);

  if (!hasSession && !isPublicPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && isGuestOnlyPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
