/**
 * LLM-based card-picking (Module 4) — server-only.
 *
 * Design: RULES SHORTLIST, LLM CHOOSES — with the person's REAL content.
 *  1. The rules (templates/guards.ts + rank.ts) decide which cards a profile can
 *     actually fill, and rank them. We take the top few as a SHORTLIST — the LLM
 *     only ever sees cards that already fit, so it can never suggest one that
 *     would render badly.
 *  2. The LLM is given the person's ACTUAL extracted profile (not just counts)
 *     plus the shortlisted layouts (each with a visual description and a
 *     "best for" hint), and picks the best 3 for THIS person — matching content
 *     and tone (field, seniority, what stands out), which the rules cannot judge.
 *
 * Honesty guards kept from the rule-based version:
 *  - No fit percentages, ever — just a rank, a coarse tier, and reasons.
 *  - The tier is borrowed from the rule-based score (a grounded signal), not
 *    invented by the LLM.
 *  - Ids are restricted to the shortlist; unknown/duplicate ids are dropped.
 *  - Any failure (no LLM configured, model error, bad JSON, too few valid picks)
 *    falls back to the deterministic rule-based top 3.
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

/** How many eligible cards the rules hand to the LLM to choose among. */
const CANDIDATE_COUNT = 6;
/** The reply (3 ids + short reasons) is tiny — a small cap keeps the input window free. */
const SUGGEST_MAX_TOKENS = 700;
/** Safety cap on the serialized profile so a monster CV can't blow the context window. */
const PROFILE_CHAR_CAP = 16000;

/** Shape we ask the model to return. */
interface LLMPick {
  picks: Array<{ id: number; reason: string }>;
}

const SUGGEST_SYSTEM = `You are a design assistant that chooses the best smart-card layouts for a person, based on WHO THEY ARE and WHAT THEIR PROFILE CONTAINS.

You are given:
- The person's real profile content (their actual details).
- A shortlist of candidate card layouts. All of them already FIT this profile by our rules — your job is to choose the best 3 for THIS specific person.

How to choose:
- Match the layout to the person's content AND tone: their field/role, seniority, and what stands out. For example: a formal or senior profile suits an understated layout; a design or personal-brand profile suits a bold, visual one; a clear multi-role career suits a step/ladder layout; a thin profile suits a spacious, simple layout.
- Prefer a layout whose "Best for" line fits this person.

STRICT RULES:
- Only choose from the candidate ids listed. Never invent an id or a layout.
- Each reason must be a checkable fact about THIS profile (e.g. "5 years across 3 senior roles"). Do NOT use percentages or scores.

Respond with ONLY a JSON object:
{ "picks": [ { "id": number, "reason": string }, { "id": number, "reason": string }, { "id": number, "reason": string } ] }`;

/**
 * LLM-ranked suggestions, with a rule-based fallback. Async (calls the model).
 * Signature mirrors the shape the route already uses so it is a drop-in.
 */
export async function suggestTemplatesLLM(profile: CardProfile): Promise<Suggestion[]> {
  const pool = templatesFor(profile.profileType);
  const eligibility = eligibleTemplates(profile);
  // The rule-based ranking is the shortlist source, the fallback, AND the tier source.
  const ruleRanked = rankTemplates(profile, pool, eligibility);
  const ruleTop = topSuggestions(ruleRanked);

  // No LLM configured → keep the deterministic behaviour.
  if (!isLocalLLM() && !process.env.OPENAI_API_KEY) return ruleTop;
  // 3 or fewer eligible → nothing to choose; the rules already are the answer.
  if (ruleRanked.length <= 3) return ruleTop;

  // Rules pick the shortlist (top 6 by rule rank); the LLM only chooses within it.
  const shortlist = ruleRanked.slice(0, CANDIDATE_COUNT);
  const allowed = new Set(shortlist.map((s) => s.id));

  try {
    const byId = new Map(pool.map((t) => [t.id, t]));
    const tierById = new Map(ruleRanked.map((s) => [s.id, s.tier]));

    const cardList = shortlist
      .map((s) => {
        const info = byId.get(s.id);
        if (!info) return "";
        const best = info.bestFor ? ` — Best for: ${info.bestFor}` : "";
        return `- id ${info.id} · ${info.name}: ${info.description}${best}`;
      })
      .filter(Boolean)
      .join("\n");

    const user = `PERSON'S PROFILE (the real extracted content):
${profileForLLM(profile)}

CANDIDATE LAYOUTS (all ${shortlist.length} already fit this profile by our rules — choose among these only):
${cardList}

Pick the best 3 for this person, ranked best first, with a one-sentence reason each.`;

    const text = await runChatJSON(SUGGEST_SYSTEM, user, "suggest", SUGGEST_MAX_TOKENS);
    const parsed = parseJSONLoose<LLMPick>(text);

    const picks = Array.isArray(parsed?.picks) ? parsed.picks : [];
    const seen = new Set<number>();
    const result: Suggestion[] = [];

    for (const p of picks) {
      const info = byId.get(p.id);
      // Must be a real card AND one of the shortlisted candidates, no duplicates.
      if (!info || !allowed.has(info.id) || seen.has(info.id)) continue;
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

    // Fewer than 3 valid picks → top up from the rule-based order (a subset of the
    // shortlist), so the caller always gets a full shortlist of 3.
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
 *    percentage on a suggestion — a small model will sometimes write "92% match"
 *    anyway, so a reason carrying `%` is thrown out and the caller falls back to
 *    the neutral default.
 */
function cleanReason(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.includes("%")) return ""; // never surface a fabricated score
  return text.length > 200 ? text.slice(0, 197).trimEnd() + "…" : text;
}

/**
 * The person's REAL profile, serialised for the model — actual content, not
 * counts, so the model can judge field/seniority/tone. Only present fields are
 * included, and the whole thing is capped so an unusually large CV cannot exceed
 * the context window. (This feeds only the ranking decision; the card itself
 * still renders every field.)
 */
function profileForLLM(p: CardProfile): string {
  const out: string[] = [];
  const add = (label: string, val: string | null | undefined) => {
    if (val && val.trim()) out.push(`${label}: ${val.trim()}`);
  };
  const join = (parts: Array<string | null | undefined>, sep = ", ") =>
    parts.filter((x) => x && x.trim()).join(sep);

  out.push(`Profile type: ${p.profileType}`);
  add("Name", p.fullName);
  add("Headline / role", join([p.designation, p.currentCompany], " @ "));
  add("Total years of experience", p.totalYearsExperience);
  add("Location", p.location);
  add("Bio", p.bio);

  if (p.skills.length) out.push(`Skills (${p.skills.length}): ${p.skills.join(", ")}`);
  if (p.languages.length) out.push(`Languages: ${p.languages.join(", ")}`);

  if (p.education.length) {
    out.push("Education:");
    for (const e of p.education) {
      const line = join([join([e.degree, e.field], " "), e.institution, e.year]);
      if (line) out.push(`  - ${line}`);
    }
  }

  if (p.experience.length) {
    out.push("Experience:");
    for (const x of p.experience) {
      const head = join([join([x.role, x.company], " @ "), x.duration], " — ");
      if (head) out.push(`  - ${head}`);
      for (const h of x.highlights ?? []) if (h && h.trim()) out.push(`      • ${h.trim()}`);
    }
  }

  if (p.projects.length) {
    out.push("Projects:");
    for (const pr of p.projects) {
      const line = join([pr.title, pr.description], ": ");
      if (line) out.push(`  - ${line}${pr.technologies?.length ? ` [${pr.technologies.join(", ")}]` : ""}`);
    }
  }

  if (p.internships.length) {
    out.push("Internships:");
    for (const i of p.internships) {
      const line = join([join([i.role, i.organization], " @ "), i.duration], " — ");
      if (line) out.push(`  - ${line}`);
    }
  }

  const certs = p.certifications.filter((c) => c.name).map((c) => join([c.name, c.issuer, c.year]));
  if (certs.length) out.push(`Certifications: ${certs.join("; ")}`);

  const pubs = p.publications.filter((x) => x.title).map((x) => join([x.title, x.venue, x.year]));
  if (pubs.length) out.push(`Publications: ${pubs.join("; ")}`);

  const ach = p.achievements.filter((a) => a.title).map((a) => join([a.title, a.year]));
  if (ach.length) out.push(`Achievements: ${ach.join("; ")}`);

  const extras = (p.extracurriculars ?? []).filter((e) => e.activity).map((e) => e.activity as string);
  if (extras.length) out.push(`Extracurriculars: ${extras.join("; ")}`);

  const regs = (p.registrations ?? []).filter((r) => r.type || r.id).map((r) => join([r.type, r.id], " "));
  if (regs.length) out.push(`Registrations: ${regs.join("; ")}`);

  const websites = p.websites?.length ? p.websites : p.website ? [p.website] : [];
  if (websites.length) out.push(`Links: ${websites.join(", ")}`);

  const socials = (p.socialLinks ?? [])
    .filter((s) => s.url)
    .map((s) => (s.platform ? `${s.platform}: ${s.url}` : (s.url as string)));
  if (socials.length) out.push(`Social: ${socials.join(", ")}`);

  const text = out.join("\n");
  return text.length > PROFILE_CHAR_CAP ? text.slice(0, PROFILE_CHAR_CAP) + "\n…(truncated)" : text;
}

export type { ProfileType };
