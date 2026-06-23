import { NextResponse, type NextRequest } from "next/server";
import { enhanceProfile } from "@/lib/enhance-engine";
import { fail, tokenMatches } from "@/lib/route-helpers";
import type { EnhanceRequest, EnhanceSuccess } from "@/lib/enhance-types";

export const runtime = "nodejs";
export const maxDuration = 800;

/**
 * Module 3 — AI Content Enhancement endpoint (Handoff 3).
 *
 *   POST /api/enhance
 *   Authorization: Bearer <auth_token>
 *   Content-Type: application/json
 *   Body: { profile: {...}, profile_type: "student" | "professional" }
 *
 * Receives a human-verified profile from AnurCloud, calls the enhancement
 * engine, and returns a polished bio, categorized skills, and completeness score.
 */
export async function POST(request: NextRequest) {
  // 1. Auth
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return fail("UNAUTHORIZED", "Missing or malformed Authorization Bearer token.", 401);
  }
  if (!process.env.EXTRACT_AUTH_TOKEN) {
    return fail("AUTH_NOT_CONFIGURED", "Enhancement auth is not configured.", 503);
  }
  if (!tokenMatches(token)) {
    return fail("UNAUTHORIZED", "Invalid authorization token.", 401);
  }

  // 2. Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_BODY", "Request body must be valid JSON.", 400);
  }

  if (!body || typeof body !== "object") {
    return fail("INVALID_BODY", "Request body must be a JSON object.", 400);
  }

  const req = body as Record<string, unknown>;

  // 3. Validate profile_type
  const profileType = req.profile_type;
  if (profileType !== "student" && profileType !== "professional") {
    return fail("INVALID_PROFILE_TYPE", '"profile_type" must be "student" or "professional".', 400);
  }

  // 4. Validate profile
  if (!req.profile || typeof req.profile !== "object") {
    return fail("INVALID_PROFILE", '"profile" must be a non-null object.', 400);
  }

  // 5. Enhancement engine not configured → validation-only stub
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      status: "received",
      message: "Profile validated. The enhancement engine is not configured.",
      received: { profile_type: profileType },
    });
  }

  // 6. Run enhancement
  try {
    const result = await enhanceProfile({
      profile: req.profile as EnhanceRequest["profile"],
      profile_type: profileType,
    });
    return NextResponse.json(result satisfies EnhanceSuccess);
  } catch (err) {
    console.error("[enhance] engine error:", err);
    return fail("ENHANCEMENT_FAILED", "The enhancement engine could not process this request.", 502);
  }
}
