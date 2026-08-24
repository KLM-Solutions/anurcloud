import { NextResponse, type NextRequest } from "next/server";
import { fail, tokenMatches } from "@/lib/route-helpers";
import { profileToCard } from "@/lib/profile-to-card";
import { brandToTheme } from "@/lib/brand-to-theme";
import {
  eligibleTemplates,
  offerableTemplates,
  plannedTemplates,
  templatesFor,
} from "@/templates";
import { suggestTemplatesLLM } from "@/lib/suggest-llm";
import { dataLevel } from "@/templates/guards";
import { resolveTheme } from "@/templates/theme";
import type {
  TemplateReceived,
  TemplateRequest,
  TemplateSuccess,
  ThemeReport,
} from "@/lib/template-types";

export const runtime = "nodejs";
export const maxDuration = 800;

/**
 * Module 4 — Template endpoint (Handoff 3).
 *
 *   POST /api/template
 *   Authorization: Bearer <auth_token>
 *   Content-Type: application/json
 *   Body: { profile, profile_type, enhanced?, brand?, photo_url?, template?, theme? }
 *
 * Returns eligibility (which cards this profile can fill, and why the others
 * can't) plus an LLM-ranked shortlist. It does NOT render a card: the cards are
 * React components (`components/cards/`) rendered client-side. The theme is still
 * resolved from `brand` here so the caller gets a ready palette + logo to hand to
 * the component (Mithra's 3 Aug 2026 request); a `template` field in the body, if
 * present, is ignored.
 */
export async function POST(request: NextRequest) {
  // 1. Auth
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return fail("UNAUTHORIZED", "Missing or malformed Authorization Bearer token.", 401);
  }
  if (!process.env.EXTRACT_AUTH_TOKEN) {
    return fail("AUTH_NOT_CONFIGURED", "Template auth is not configured.", 503);
  }
  if (!tokenMatches(token)) {
    return fail("UNAUTHORIZED", "Invalid authorization token.", 401);
  }

  // 2. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_BODY", "Request body must be valid JSON.", 400);
  }
  if (!body || typeof body !== "object") {
    return fail("INVALID_BODY", "Request body must be a JSON object.", 400);
  }

  const req = body as Partial<TemplateRequest> & Record<string, unknown>;

  // 3. Validate
  const profileType = req.profile_type;
  if (profileType !== "student" && profileType !== "professional") {
    return fail("INVALID_PROFILE_TYPE", '"profile_type" must be "student" or "professional".', 400);
  }
  if (!req.profile || typeof req.profile !== "object") {
    return fail("INVALID_PROFILE", '"profile" must be a non-null object.', 400);
  }

  // 4. Clean and shape. Never throws on messy input — that is the point of it.
  const card = profileToCard({
    profile: req.profile,
    profile_type: profileType,
    enhanced: req.enhanced ?? null,
    photo_url: req.photo_url ?? null,
  });

  // 5. Theme. Derived from the user's own logo/website when we have one.
  const outcome = brandToTheme(req.brand ?? null, { overrides: req.theme ?? {} });
  const resolved = resolveTheme(outcome.theme, profileType);
  const themeReport: ThemeReport = {
    brand_applied: outcome.applied,
    reason: outcome.reason,
    primary: resolved.colors.primary,
    accent: resolved.colors.accent,
    logo_url: outcome.theme.logo?.url ?? null,
  };

  const level = dataLevel(card);

  // 6. No cards built yet → say so plainly rather than returning an empty success.
  if (templatesFor(profileType).length === 0) {
    const received: TemplateReceived = {
      status: "received",
      message:
        "Profile validated and theme resolved. No card templates are built for this profile type yet.",
      profile_type: profileType,
      data_level: level,
      theme: themeReport,
      planned: plannedTemplates.filter((t) => t.audience === profileType),
    };
    return NextResponse.json(received);
  }

  const eligibility = eligibleTemplates(card);
  const offered = offerableTemplates(card);

  const result: TemplateSuccess = {
    status: "success",
    profile_type: profileType,
    data_level: level,
    // The short list is what a picker should show. `offered` stays in the
    // response for the "see all layouts" case and for callers written against
    // the older shape — adding a field breaks nobody, replacing one does.
    // The count is fixed at three in templates/rank.ts and is deliberately not a
    // request parameter: a caller that could ask for twelve would turn the
    // recommendation back into the catalogue it replaces.
    // LLM-ranked shortlist (rules filter eligibility first, then the model ranks
    // and explains the top 3). Falls back to rule-based ranking automatically.
    suggested: await suggestTemplatesLLM(card),
    eligibility,
    offered,
    theme: themeReport,
  };

  return NextResponse.json(result);
}
