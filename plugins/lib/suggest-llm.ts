/**
 * LLM-based card-picking (Module 4) — server-only.
 *
 * Design: RULES FIRST, LLM SECOND.
 *  1. The rules (templates/guards.ts + rank.ts) decide which cards a profile can
 *     actually fill — the LLM only ever sees eligible cards, so it can never
 *     suggest one that would render badly.
 *  2. The LLM ranks the eligible cards and picks the top 3, writing a short,
 *     profile-specific reason for each.
 *
 * Honesty guards kept from the rule-based version:
 *  - No fit percentages, ever — just a rank, a coarse tier, and reasons.
 *  - The tier is borrowed from the rule-based score (a grounded signal), not
 *    invented by the LLM.
 *  - Any failure (no LLM configured, model error, bad JSON, unknown ids) falls
 *    back to the deterministic rule-based `suggestTemplates`.
 */

import { runChatJSON, parseJSONLoose, isLocalLLM } from "@/lib/llm-chat";
import {
  eligibleTemplates,
  rankTemplates,
  templatesFor,
  topSuggestions,
  type CardProfile,
  type ProfileType,
  type Suggestion,
} from "@/templates";

/** Shape we ask the model to return. */
interface LLMPick {
  picks: Array<{ id: number; reason: string }>;
}

const SUGGEST_SYSTEM = `You are a design assistant that picks the best smart-card layouts for a person's profile.

You are given:
- A short summary of the profile (what data it actually contains).
- A list of ELIGIBLE card layouts (id, name, and what each layout is good for).

Your job: choose the 3 layouts that best fit THIS profile, ranked best-first, and give a one-sentence reason for each.

STRICT RULES:
- Only choose from the eligible layouts listed. Never invent an id or a layout.
- Each reason must be a checkable fact about the profile (e.g. "has 4 dated entries for the timeline"). Do not use percentages or scores.
- Match the layout to how much content the profile has: sparse layouts suit thin profiles, dense layouts suit full ones.

Respond with ONLY a JSON object:
{ "picks": [ { "id": number, "reason": string }, { "id": number, "reason": string }, { "id": number, "reason": string } ] }`;

/**
 * LLM-ranked suggestions, with a rule-based fallback. Async (calls the model).
 * Signature mirrors the shape the route already uses so it is a drop-in.
 */
export async function suggestTemplatesLLM(profile: CardProfile): Promise<Suggestion[]> {
  const pool = templatesFor(profile.profileType);
  const eligibility = eligibleTemplates(profile);
  // The rule-based ranking is both the fallback AND the source of the honest tier.
  const ruleRanked = rankTemplates(profile, pool, eligibility);
  const ruleTop = topSuggestions(ruleRanked);

  // No LLM configured → keep today's deterministic behaviour.
  if (!isLocalLLM() && !process.env.OPENAI_API_KEY) return ruleTop;

  const eligible = ruleRanked; // already only eligible cards, best-first
  if (eligible.length <= 3) return ruleTop; // nothing to rank — rules suffice

  try {
    const byId = new Map(pool.map((t) => [t.id, t]));
    const tierById = new Map(ruleRanked.map((s) => [s.id, s.tier]));

    const cardList = eligible
      .map((s) => {
        const info = byId.get(s.id);
        return info ? `- id ${info.id} · ${info.name}: ${info.description}` : "";
      })
      .filter(Boolean)
      .join("\n");

    const summary = profileSummary(profile);
    const user = `PROFILE SUMMARY:\n${summary}\n\nELIGIBLE LAYOUTS:\n${cardList}\n\nPick the best 3, ranked.`;

    const text = await runChatJSON(SUGGEST_SYSTEM, user, "suggest");
    const parsed = parseJSONLoose<LLMPick>(text);

    const picks = Array.isArray(parsed?.picks) ? parsed.picks : [];
    const seen = new Set<number>();
    const result: Suggestion[] = [];

    for (const p of picks) {
      const info = byId.get(p.id);
      if (!info || seen.has(info.id)) continue; // ignore invented/duplicate ids
      seen.add(info.id);
      const reason = cleanReason(p.reason);
      result.push({
        id: info.id,
        key: info.key,
        name: info.name,
        rank: result.length + 1,
        tier: tierById.get(info.id) ?? "good", // grounded tier, not LLM-invented
        score: 0, // not a measurement; never shown
        reasons: reason ? [reason] : ["Selected as a strong fit for this profile."],
      });
      if (result.length === 3) break;
    }

    // If the model gave us fewer than 3 valid picks, top up from the rule-based
    // order so the caller always gets a full shortlist.
    if (result.length < 3) {
      for (const s of ruleTop) {
        if (result.length === 3) break;
        if (!seen.has(s.id)) {
          seen.add(s.id);
          result.push({ ...s, rank: result.length + 1 });
        }
      }
    }

    return result.length ? result : ruleTop;
  } catch (err) {
    console.warn("[suggest] LLM ranking failed, using rule-based fallback:", (err as Error).message);
    return ruleTop;
  }
}

/**
 * Sanitise a model-written reason.
 *  - single line, whitespace collapsed, capped length;
 *  - drop it entirely if it smells like a fit score. The product NEVER shows a
 *    percentage on a suggestion (verify asserts no `%` appears) — a small model
 *    will sometimes write "92% match" anyway, so a reason carrying `%` is thrown
 *    out and the caller falls back to the neutral default.
 */
function cleanReason(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.includes("%")) return ""; // never surface a fabricated score
  return text.length > 200 ? text.slice(0, 197).trimEnd() + "…" : text;
}

/** A compact, factual summary of what the profile actually contains. */
function profileSummary(p: CardProfile): string {
  const lines: string[] = [];
  const n = (arr: unknown[] | undefined) => (Array.isArray(arr) ? arr.length : 0);
  lines.push(`profile type: ${p.profileType}`);
  if (p.fullName) lines.push(`name: ${p.fullName}`);
  if (p.bio) lines.push(`bio length: ${p.bio.trim().length} chars`);
  lines.push(`education entries: ${n(p.education)}`);
  lines.push(`experience entries: ${n(p.experience)}`);
  lines.push(`projects: ${n(p.projects)}`);
  lines.push(`internships: ${n(p.internships)}`);
  lines.push(`skills: ${n(p.skills)}`);
  lines.push(`certifications: ${n(p.certifications)}`);
  lines.push(`languages: ${n(p.languages)}`);
  lines.push(`social links: ${n(p.socialLinks)}`);
  return lines.join("\n");
}

export type { ProfileType };
