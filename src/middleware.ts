import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BETA_PASSWORD = process.env.BETA_PASSWORD || "juniply2025";
const COOKIE_NAME = "beta_access";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip beta gate for the access page itself, its API route, static files, and auth API
  if (
    pathname === "/beta-access" ||
    pathname === "/api/beta-access" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg")
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME);

  if (cookie?.value === "granted") {
    return NextResponse.next();
  }

  // Redirect to beta access page
  const url = request.nextUrl.clone();
  url.pathname = "/beta-access";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
