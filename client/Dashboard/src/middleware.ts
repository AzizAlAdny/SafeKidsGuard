import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/alerts",
  "/children",
  "/activity",
  "/policies",
  "/reports",
  "/notifications",
  "/admin",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  const isAuth = request.cookies.get("skg_auth")?.value === "1";
  const role = request.cookies.get("skg_role")?.value;

  if (!isAuth) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/alerts/:path*",
    "/children/:path*",
    "/activity/:path*",
    "/policies/:path*",
    "/reports/:path*",
    "/notifications/:path*",
    "/admin/:path*",
  ],
};
