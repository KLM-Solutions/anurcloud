import { NextResponse, type NextRequest } from "next/server";
import { fail, tokenMatches } from "@/lib/route-helpers";
import { profileToCard } from "@/lib/profile-to-card";
import { brandToTheme } from "@/lib/brand-to-theme";
import {
  eligibleTemplates,
  offerableTemplates,
  plannedTemplates,
  renderCard,
  templates,
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
 * Two modes:
 *   - no `template` → eligibility only: which cards this profile can fill, and
 *     why the others can't
 *   - `template` given → the same, plus rendered HTML
 *
 * The card is themed automatically from `brand` when it is supplied, so the
 * caller never has to work out a palette (Mithra's 3 Aug 2026 request).
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
    // A caller who explicitly asked for a card must not get a quiet 200 back:
    // silently dropping the request would read as "rendered fine, no HTML".
    if (req.template !== undefined && req.template !== null) {
      return fail(
        "UNKNOWN_TEMPLATE",
        `No card templates are built for ${profileType} profiles yet, so "${String(
          req.template,
        )}" cannot be rendered.`,
        404,
      );
    }

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

  // 7. Render, if one was asked for.
  if (req.template !== undefined && req.template !== null) {
    const selector = req.template;
    if (typeof selector !== "number" && typeof selector !== "string") {
      return fail("INVALID_TEMPLATE", '"template" must be a template number or key.', 400);
    }

    const info = templates.find(
      (t) => t.id === selector || t.key === String(selector).toLowerCase(),
    );
    if (!info) {
      const avail = templates.map((t) => `${t.id} (${t.key})`).join(", ") || "none yet";
      return fail(
        "UNKNOWN_TEMPLATE",
        `Unknown or unbuilt template "${selector}". Available: ${avail}.`,
        404,
      );
    }
    if (info.audience !== profileType) {
      return fail(
        "TEMPLATE_WRONG_AUDIENCE",
        `Template ${info.id} ("${info.key}") is for ${info.audience} profiles, not ${profileType}.`,
        400,
      );
    }

    // Gate on data, not just on existence — a card offered without the content
    // to fill it renders badly, which is the whole reason minimums exist.
    const check = eligibility.find((e) => e.key === info.key);
    if (check && !check.eligible) {
      return fail(
        "TEMPLATE_NOT_ELIGIBLE",
        `${info.name} cannot be rendered for this profile. ${check.reason}`,
        422,
      );
    }

    try {
      result.html = renderCard(info.id, card, outcome.theme);
      result.rendered = { id: info.id, key: info.key, name: info.name };
    } catch (err) {
      console.error("[template] render error:", err);
      return fail("RENDER_FAILED", "The template could not be rendered.", 502);
    }
  }

  return NextResponse.json(result);
}
