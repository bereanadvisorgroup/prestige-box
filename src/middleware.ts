import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Intercept all requests under /dashboard/* and /api/*
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isApiRoute = pathname.startsWith("/api");

  // Allow auth callbacks or public api routes if they are needed
  const isPublicApiRoute = pathname.startsWith("/api/auth") || pathname.includes("/public");

  if (!isDashboardRoute && (!isApiRoute || isPublicApiRoute)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] : "";
  const cookieKey = projectRef ? `sb-${projectRef}-auth-token` : "";

  let sessionCookieValue = "";
  if (cookieKey) {
    sessionCookieValue = request.cookies.get(cookieKey)?.value || "";
  }

  if (!sessionCookieValue) {
    // Try to find any supabase auth token cookie in case projectRef doesn't match perfectly
    const allCookies = request.cookies.getAll();
    const sbCookie = allCookies.find((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
    if (sbCookie) {
      sessionCookieValue = sbCookie.value;
    }
  }

  if (!sessionCookieValue) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let sessionData: { access_token?: string } | null = null;
  try {
    sessionData = JSON.parse(decodeURIComponent(sessionCookieValue));
  } catch {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const accessToken = sessionData?.access_token;
  if (!accessToken) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Base64url decode JWT payload to read roles and authenticator level (aal)
  let payload: { exp?: number; aal?: string; role?: string } | null = null;
  try {
    const payloadPart = accessToken.split(".")[1];
    if (!payloadPart) throw new Error("Invalid JWT token format");
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = atob(base64);
    payload = JSON.parse(jsonPayload);
  } catch {
    if (isApiRoute) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check expiration
  const exp = payload?.exp;
  if (!exp || Date.now() >= exp * 1000) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check AAL
  const aal = payload?.aal || "aal1";
  if (aal === "aal1") {
    if (isApiRoute) {
      return NextResponse.json({ error: "MFA required" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/auth/mfa-verify", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
