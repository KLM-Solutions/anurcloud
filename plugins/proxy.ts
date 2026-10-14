/**
 * CORS for the API — which websites may call `/api/*` from a browser.
 *
 * - `ALLOWED_ORIGINS` (comma-separated, e.g. "https://app.example.com,https://staging.example.com")
 *   lists the external sites allowed to call the API from the browser.
 * - The app's own pages (same host) are always allowed.
 * - Requests with no `Origin` header (server-to-server, curl) pass through; the
 *   Bearer token check in each route still applies.
 * - A browser request from any other site is refused with 403, so it never reaches
 *   the route (and never spends extraction credits).
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fail } from "@/lib/route-helpers";

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "600",
};

function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

function isSameHost(origin: string, request: NextRequest): boolean {
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");

  // No Origin → not a cross-site browser call; same host → our own pages.
  if (!origin || isSameHost(origin, request)) {
    return NextResponse.next();
  }

  if (!allowedOrigins().includes(origin)) {
    return fail("ORIGIN_NOT_ALLOWED", "This origin is not allowed.", 403);
  }

  const headers = { "Access-Control-Allow-Origin": origin, Vary: "Origin", ...CORS_HEADERS };

  // Preflight: answer here, the routes have no OPTIONS handlers.
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
