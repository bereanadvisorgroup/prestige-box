import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Intercept requests under /dashboard/* and /api/*
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isApiRoute = pathname.startsWith("/api");
  const isPublicApiRoute = pathname.startsWith("/api/auth") || pathname.includes("/public");

  if (!isDashboardRoute && (!isApiRoute || isPublicApiRoute)) {
    return NextResponse.next();
  }

  // Client-side routes rely on AuthProvider for auth guards and session state.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
