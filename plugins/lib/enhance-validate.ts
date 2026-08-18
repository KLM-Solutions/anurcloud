/**
 * Validate & correct the enhancement model's output — Module 3 (server-only).
 *
 * A small local model (Qwen 3.5 4B) is looser than GPT-4.1: it can rename the
 * identity keys we match on, invent entries that were never in the profile, or
 * return the wrong types. This layer makes the raw output safe to trust:
 *
 *  1. SHAPE — coerce every field to the type the card renderer expects; drop
 *     anything unusable rather than passing a half-object downstream.
 *  2. GROUNDING — an enhanced project / internship / experience is kept ONLY if
 *     its identity key matches an entry that was actually in the request profile.
 *     This is the same "never invent" rule the prompt states, enforced in code
 *     because a 4B model will occasionally break it. Unmatched (hallucinated)
 *     entries are dropped; a matched entry whose enhancement came back empty
 *     falls back to the profile's own text so nothing is silently lost.
 */

import type {
  EnhanceRequest,
  EnhanceSuccess,
  EnhancedProject,
  EnhancedInternship,
  EnhancedExperience,
} from "@/lib/enhance-types";

/** Normalise an identity string for matching: lower, trimmed, collapsed spaces. */
function idKey(...parts: Array<string | null | undefined>): string {
  return parts
    .map((p) => (typeof p === "string" ? p : ""))
    .join("")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Coerce an unknown to a trimmed string ("" when not a usable string). */
function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Coerce an unknown to a clean array of non-empty trimmed strings. */
function strList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(str).filter(Boolean);
}

/** A row of unknown shape → an object we can read keys off without throwing. */
function asRow(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

/**
 * Validate and correct a parsed enhancement result against the request profile.
 * Never throws on shape — the only hard failure is a missing/empty bio, which
 * the caller treats as "model gave us nothing usable".
 */
export function validateEnhance(raw: unknown, req: EnhanceRequest): EnhanceSuccess {
  const out = asRow(raw);
  const profile = req.profile ?? {};

  const bio = str(out.bio);
  if (!bio) {
    throw new Error("Enhancement model returned an incomplete response (no bio).");
  }

  return {
    status: "success",
    bio,
    projects: groundProjects(out.projects, profile.projects),
    internships: groundInternships(out.internships, profile.internships),
    experience: groundExperience(out.experience, profile.experience),
  };
}

/** Keep only enhanced projects whose title matches an original project. */
function groundProjects(
  enhanced: unknown,
  original: EnhanceRequest["profile"]["projects"],
): EnhancedProject[] {
  const originals = new Map<string, string>();
  for (const p of original ?? []) {
    const title = str(p?.title);
    if (title) originals.set(idKey(title), str(p?.description));
  }

  const seen = new Set<string>();
  const result: EnhancedProject[] = [];
  for (const row of Array.isArray(enhanced) ? enhanced : []) {
    const r = asRow(row);
    const title = str(r.title);
    if (!title) continue;
    const key = idKey(title);
    if (!originals.has(key) || seen.has(key)) continue; // invented or duplicate → drop
    seen.add(key);
    const description = str(r.description) || originals.get(key) || "";
    if (!description) continue; // nothing to show
    result.push({ title, description });
  }
  return result;
}

/** Keep only enhanced internships whose (role, organization) matches an original. */
function groundInternships(
  enhanced: unknown,
  original: EnhanceRequest["profile"]["internships"],
): EnhancedInternship[] {
  const originals = new Map<string, string>();
  for (const i of original ?? []) {
    const role = str(i?.role);
    const org = str(i?.organization);
    if (role || org) originals.set(idKey(role, org), str(i?.description));
  }

  const seen = new Set<string>();
  const result: EnhancedInternship[] = [];
  for (const row of Array.isArray(enhanced) ? enhanced : []) {
    const r = asRow(row);
    const role = str(r.role);
    const organization = str(r.organization);
    if (!role && !organization) continue;
    const key = idKey(role, organization);
    if (!originals.has(key) || seen.has(key)) continue;
    seen.add(key);
    const description = str(r.description) || originals.get(key) || "";
    if (!description) continue;
    result.push({ role, organization, description });
  }
  return result;
}

/** Keep only enhanced experience whose (role, company) matches an original. */
function groundExperience(
  enhanced: unknown,
  original: EnhanceRequest["profile"]["experience"],
): EnhancedExperience[] {
  const originals = new Map<string, string[]>();
  for (const e of original ?? []) {
    const role = str(e?.role);
    const company = str(e?.company);
    if (role || company) originals.set(idKey(role, company), strList(e?.highlights));
  }

  const seen = new Set<string>();
  const result: EnhancedExperience[] = [];
  for (const row of Array.isArray(enhanced) ? enhanced : []) {
    const r = asRow(row);
    const role = str(r.role);
    const company = str(r.company);
    if (!role && !company) continue;
    const key = idKey(role, company);
    if (!originals.has(key) || seen.has(key)) continue;
    seen.add(key);
    const highlights = strList(r.highlights);
    const final = highlights.length ? highlights : originals.get(key) ?? [];
    if (!final.length) continue;
    result.push({ role, company, highlights: final });
  }
  return result;
}
