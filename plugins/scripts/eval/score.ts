/**
 * Deterministic quality scoring for the two LLM jobs — no model in the loop.
 *
 * Every check here is a plain, checkable rule (empty? first person? grounded?),
 * so the score is reproducible and honest — the same principle the product holds
 * for what it shows a user. The scorer is applied identically to GPT-4.1 and to
 * Qwen, so even where a heuristic is imperfect (grounding, below) the DELTA
 * between two models is meaningful because both are measured the same way.
 *
 * Grounding is the most important trust metric: it catches a bio that names a
 * company, degree or number that is NOT in the source profile — the exact way a
 * 4B model breaks the "never invent" rule. It is a heuristic, flagged as such.
 */

import type { Suggestion } from "@/templates";

/* ── shared text helpers ──────────────────────────────────────────────────── */

/** Flatten every string value in the profile into one lowercase blob. */
export function flattenProfileText(profile: unknown): string {
  const parts: string[] = [];
  const walk = (v: unknown): void => {
    if (typeof v === "string") parts.push(v);
    else if (typeof v === "number") parts.push(String(v));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(profile);
  return normalize(parts.join(" "));
}

/** Lowercase + collapse whitespace. Punctuation is kept so "b.tech" survives. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Pull the "claim tokens" out of a bio — the proper nouns and numbers a reader
 * would treat as facts (a company, a degree, a year, a count). The first word of
 * each sentence is dropped, because a sentence-initial capital is grammar, not a
 * proper noun. Pronouns and filler are stopped out.
 */
const STOP = new Set([
  "i", "i'm", "i've", "i'll", "my", "me", "a", "an", "the", "and", "or", "but",
  "am", "is", "are", "was", "with", "for", "at", "in", "on", "of", "to", "as",
  "currently", "student", "based", "experience", "years", "year",
]);

function claimTokens(bio: string): string[] {
  const sentences = bio.split(/(?<=[.!?])\s+/);
  const tokens: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/).slice(1); // drop sentence-initial word
    for (const raw of words) {
      // Trim edge punctuation. A trailing dot is stripped (it is sentence
      // punctuation) but internal dots are kept, so "node.js" / "b.tech" survive
      // while "College." becomes "College".
      const w = raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9+#/-]+$/g, "");
      if (!w || w.length < 2) continue;
      const isProper = /^[A-Z][a-z]/.test(w); // Freshworks, Chennai
      const isAcronym = /^[A-Z]{2,}$/.test(w); // SQL, CKA, VP
      const hasNumber = /\d/.test(w); // 2023, 12
      if (!isProper && !isAcronym && !hasNumber) continue;
      const lower = w.toLowerCase();
      if (STOP.has(lower)) continue;
      tokens.push(lower);
    }
  }
  return [...new Set(tokens)];
}

/* ── bio scoring ──────────────────────────────────────────────────────────── */

export interface Check {
  name: string;
  pass: boolean;
  /** Populated only when it fails / is worth showing. */
  detail?: string;
}

export interface BioScore {
  bio: string;
  checks: Check[];
  passed: number;
  total: number;
  /** Tokens in the bio not found in the source profile (the invented facts). */
  ungrounded: string[];
}

export function scoreBio(bio: string, profileText: string): BioScore {
  const b = (bio ?? "").trim();
  const sentences = b.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0).length;

  const ungrounded = b
    ? claimTokens(b).filter((t) => !profileText.includes(t))
    : [];

  const placeholders = ["n/a", "lorem", "todo", "insert ", "xxxx", "[", "placeholder", "your name"];
  const foundPlaceholder = placeholders.find((p) => b.toLowerCase().includes(p));

  const checks: Check[] = [
    { name: "nonEmpty", pass: b.length > 0, detail: b ? undefined : "bio is empty" },
    {
      name: "firstPerson",
      pass: /\bI\b|\bI['’]|\bmy\b/i.test(b),
      detail: /\bI\b|\bI['’]|\bmy\b/i.test(b) ? undefined : "not written in first person",
    },
    {
      name: "sentenceCount",
      pass: sentences >= 1 && sentences <= 4,
      detail: sentences >= 1 && sentences <= 4 ? undefined : `${sentences} sentences (want 1–4, ideal 2–3)`,
    },
    {
      name: "lengthOk",
      pass: b.length >= 30 && b.length <= 500,
      detail: b.length >= 30 && b.length <= 500 ? undefined : `${b.length} chars (want 30–500)`,
    },
    {
      name: "grounded",
      pass: ungrounded.length === 0,
      detail: ungrounded.length ? `invented/unmatched: ${ungrounded.join(", ")}` : undefined,
    },
    {
      name: "noPlaceholder",
      pass: !foundPlaceholder,
      detail: foundPlaceholder ? `contains "${foundPlaceholder.trim()}"` : undefined,
    },
  ];

  return {
    bio: b,
    checks,
    passed: checks.filter((c) => c.pass).length,
    total: checks.length,
    ungrounded,
  };
}

/* ── card-pick scoring ────────────────────────────────────────────────────── */

export interface PickScore {
  picks: Array<{ id: number; name: string; rank: number; tier: string; reason: string }>;
  checks: Check[];
  passed: number;
  total: number;
}

export function scorePicks(picks: Suggestion[], eligibleIds: Set<number>): PickScore {
  const ids = picks.map((p) => p.id);
  const uniqueIds = new Set(ids);
  const ineligible = ids.filter((id) => !eligibleIds.has(id));
  const withPercent = picks.filter((p) => p.reasons.some((r) => r.includes("%")));
  const emptyReasons = picks.filter((p) => !p.reasons.some((r) => r.trim().length > 0));
  const ranks = picks.map((p) => p.rank).sort((a, b) => a - b);
  const contiguous = ranks.every((r, i) => r === i + 1);

  const checks: Check[] = [
    {
      name: "count3",
      pass: picks.length === 3,
      detail: picks.length === 3 ? undefined : `returned ${picks.length} picks (want 3)`,
    },
    {
      name: "allEligible",
      pass: ineligible.length === 0,
      detail: ineligible.length ? `ineligible ids: ${ineligible.join(", ")}` : undefined,
    },
    {
      name: "distinct",
      pass: uniqueIds.size === ids.length,
      detail: uniqueIds.size === ids.length ? undefined : "duplicate card ids",
    },
    {
      name: "noPercent",
      pass: withPercent.length === 0,
      detail: withPercent.length ? "a reason contains a % fit score" : undefined,
    },
    {
      name: "reasonsPresent",
      pass: emptyReasons.length === 0,
      detail: emptyReasons.length ? `${emptyReasons.length} pick(s) have no reason` : undefined,
    },
    {
      name: "ranksContiguous",
      pass: contiguous,
      detail: contiguous ? undefined : `ranks not 1..n: ${ranks.join(",")}`,
    },
  ];

  return {
    picks: picks.map((p) => ({
      id: p.id,
      name: p.name,
      rank: p.rank,
      tier: p.tier,
      reason: p.reasons[0] ?? "",
    })),
    checks,
    passed: checks.filter((c) => c.pass).length,
    total: checks.length,
  };
}
