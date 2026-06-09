import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isProfileType, validateSourceFile } from "@/lib/validation";
import { schemaFieldKeys } from "@/lib/schema";
import { extractProfile } from "@/lib/llama";
import type { ExtractSuccess } from "@/lib/types";

// File parsing needs the Node.js runtime (not Edge).
export const runtime = "nodejs";
// Extraction (parse + LLM) can take a while. Pro plan max is 800s (~13 min);
// typical runs finish in ~15–25s, so this is a safe ceiling.
export const maxDuration = 800;

function fail(code: string, message: string, status: number) {
  return NextResponse.json({ status: "error", error: { code, message } }, { status });
}

/**
 * Service-to-service auth. AnurCloud sends a shared secret as the Bearer token.
 * When EXTRACT_AUTH_TOKEN is configured, the token must match (constant-time).
 * Returns true only when the configured secret is present AND matches.
 * (Real AnurCloud JWT verification can replace this later.)
 */
function tokenMatches(token: string): boolean {
  const expected = process.env.EXTRACT_AUTH_TOKEN;
  if (!expected) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Module 1 — Extraction endpoint (Handoff 1).
 *
 *   POST /api/extract
 *   Authorization: Bearer <auth_token>
 *   multipart/form-data: file (PDF/DOCX/JPG/PNG), profile_type
 *
 * Validates the upload, selects the schema by profile_type (Approach A), runs the
 * extraction engine, and returns the structured profile + confidence.
 */
export async function POST(request: NextRequest) {
  // 1. Auth — Authorization: Bearer <shared service secret>
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return fail("UNAUTHORIZED", "Missing or malformed Authorization Bearer token.", 401);
  }
  // Never run "open": refuse until a secret is configured (avoids credit abuse on a public URL).
  if (!process.env.EXTRACT_AUTH_TOKEN) {
    return fail("AUTH_NOT_CONFIGURED", "Extraction auth is not configured.", 503);
  }
  if (!tokenMatches(token)) {
    return fail("UNAUTHORIZED", "Invalid authorization token.", 401);
  }
  // TODO: swap the shared secret for AnurCloud JWT/introspection when its scheme is confirmed.

  // 2. Parse the multipart body
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail("INVALID_BODY", "Request body must be multipart/form-data.", 400);
  }

  const file = formData.get("file");
  const profileTypeRaw = formData.get("profile_type");

  // 3. Validate file (presence + type; no size limit)
  if (!(file instanceof File)) {
    return fail("NO_FILE", 'A "file" field (PDF/DOCX/JPG/PNG) is required.', 400);
  }
  const fileError = validateSourceFile({ name: file.name, size: file.size, type: file.type });
  if (fileError) {
    const status = fileError.code === "UNSUPPORTED_TYPE" ? 415 : 400;
    return fail(fileError.code, fileError.message, status);
  }

  // 4. Validate profile_type — selects which schema we extract against
  if (!isProfileType(profileTypeRaw)) {
    return fail("INVALID_PROFILE_TYPE", '"profile_type" must be "student" or "professional".', 400);
  }

  // 5. No engine key configured → fall back to the validation-only stub.
  if (!process.env.LLAMA_CLOUD_API_KEY) {
    return NextResponse.json({
      status: "received",
      message: "File validated. The extraction engine is not configured.",
      received: {
        file: { filename: file.name, size_bytes: file.size, mime_type: file.type || "unknown" },
        profile_type: profileTypeRaw,
      },
      schema_preview: { profile_type: profileTypeRaw, fields: schemaFieldKeys(profileTypeRaw) },
    });
  }

  // 7. Run the extraction engine against the profile-type schema and return the contract.
  try {
    const result = await extractProfile(file, profileTypeRaw);
    return NextResponse.json({
      status: "success",
      profile_type: profileTypeRaw,
      data: result.data,
      confidence_scores: result.confidence_scores,
      flagged_fields: result.flagged_fields,
    } satisfies ExtractSuccess);
  } catch (err) {
    // Full detail stays server-side; the client gets a generic message so we never
    // leak engine/vendor internals or stack details.
    console.error("[extract] engine error:", err);
    return fail("EXTRACTION_FAILED", "The extraction engine could not process this request.", 502);
  }
}
