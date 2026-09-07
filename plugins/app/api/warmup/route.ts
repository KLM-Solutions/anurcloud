import { NextResponse, type NextRequest } from "next/server";
import { warmUpModel } from "@/lib/llm-chat";
import { fail, tokenMatches } from "@/lib/route-helpers";

export const runtime = "nodejs";
// Returns immediately — the wake is fire-and-forget, so this never needs the long ceiling.
export const maxDuration = 30;

/**
 * Warm-up endpoint — wakes the self-hosted model ahead of time.
 *
 *   POST /api/warmup     (GET also works)
 *   Authorization: Bearer <auth_token>
 *
 * The self-hosted service is scale-to-zero and takes ~150s to become ready from
 * cold. This endpoint lets the front-end START that boot as early as possible —
 * e.g. the moment the user opens the flow — so the model is already warm when the
 * enhancement / card-picking step actually calls it.
 *
 * It is safe to call often: the wake is fire-and-forget and throttled per server
 * instance, and hitting a model that is already warm is a trivial no-op ping.
 * Extraction (`/api/extract`, `/api/extract-url`) already fires this automatically,
 * so calling it here is an OPTIONAL extra-early wake, not a requirement.
 */
function handle(request: NextRequest) {
  // Auth — same shared Bearer token as the other routes.
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return fail("UNAUTHORIZED", "Missing or malformed Authorization Bearer token.", 401);
  }
  if (!process.env.EXTRACT_AUTH_TOKEN) {
    return fail("AUTH_NOT_CONFIGURED", "Auth is not configured.", 503);
  }
  if (!tokenMatches(token)) {
    return fail("UNAUTHORIZED", "Invalid authorization token.", 401);
  }

  // Kick the wake off and return at once — we do not wait for the model to be ready.
  warmUpModel();
  return NextResponse.json({ status: "received", message: "Warm-up requested." }, { status: 202 });
}

export const POST = handle;
export const GET = handle;
