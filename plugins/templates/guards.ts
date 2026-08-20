/**
 * Empty-content rules and per-template data minimums.
 *
 * ── Why this file exists ──────────────────────────────────────────────────
 * Real profiles are patchy. A CV or a crawled page often yields little more
 * than a name, a course and one education line. Cards must look *deliberate*
 * at that level, not broken.
 *
 * Two rules, enforced here so they are solved ONCE:
 *
 *   1. A section with no content renders NOTHING — no heading, no rule, no
 *      gap, no tile. If twenty cards each solved this separately, one would
 *      forget, and the client would be the one to find it.
 *
 *   2. A template is only offered when the profile can actually fill it.
 *      A timeline needs a sequence; a grid needs enough blocks. Each template
 *      declares its own minimum below, and the recommender gates on it.
 *
 * See DEV-3040. Cleaning of junk values happens earlier, in the glue
 * (`lib/profile-to-card.ts`) — by the time a card runs, present means usable.
 */

import type { CardProfile, TemplateEligibility, TemplateKey } from "./types";
import { nonEmpty } from "./helpers";

/* ── Presence tests ───────────────────────────────────────────────────────── */

/** A list counts as present only if it holds at least one meaningful entry. */
export function hasList<T>(items: T[] | undefined | null, meaningful?: (item: T) => boolean): boolean {
  if (!Array.isArray(items) || items.length === 0) return false;
  if (!meaningful) return true;
  return items.some(meaningful);
}

export function hasText(value: unknown): boolean {
  return nonEmpty(value);
}

/** An education row is worth showing if it names a degree, field or institution. */
export function meaningfulEducation(e: {
  degree: string | null;
  field: string | null;
  institution: string | null;
}): boolean {
  return nonEmpty(e.degree) || nonEmpty(e.field) || nonEmpty(e.institution);
}

export function meaningfulProject(p: { title: string | null; description: string | null }): boolean {
  return nonEmpty(p.title) || nonEmpty(p.description);
}

export function meaningfulInternship(i: { role: string | null; organization: string | null }): boolean {
  return nonEmpty(i.role) || nonEmpty(i.organization);
}

export function meaningfulExperience(e: { role: string | null; company: string | null }): boolean {
  return nonEmpty(e.role) || nonEmpty(e.company);
}

export function meaningfulSocial(s: { url: string | null }): boolean {
  return nonEmpty(s.url);
}

/* ── Conditional rendering ────────────────────────────────────────────────── */

/**
 * Render a block only when it has content.
 *
 * `body` is taken as a thunk so a card never pays to build markup it then
 * discards, and so a body that renders to "" suppresses its own heading.
 */
export function block(body: () => string, wrap?: (inner: string) => string): string {
  const inner = body().trim();
  if (!inner) return "";
  return wrap ? wrap(inner) : inner;
}

/** A titled section that disappears entirely — heading included — when empty. */
export function section(title: string, body: () => string, headingClass = "iv-sec-h"): string {
  return block(body, (inner) => `<h3 class="${headingClass}">${escTitle(title)}</h3>${inner}`);
}

/** Titles are authored by us, not extracted — but escape anyway, cheaply. */
function escTitle(t: string): string {
  return t.replace(/[<>&]/g, "");
}

/**
 * Join rendered pieces with a separator, dropping empties.
 *
 * Prevents the classic sparse-data artefacts: two horizontal rules stacked
 * together, or a card that ends on a trailing rule.
 */
export function joinBlocks(pieces: string[], separator = ""): string {
  const kept = pieces.map((p) => p.trim()).filter(Boolean);
  if (kept.length === 0) return "";
  return separator ? kept.join(separator) : kept.join("");
}

/* ── Content counting (feeds the minimums below) ──────────────────────────── */

/**
 * How many top-level sections this profile can actually fill.
 * Identity (name/photo) is not counted — it is present on every card.
 */
export function countFilledSections(p: CardProfile): number {
  const sections = [
    hasText(p.bio),
    hasList(p.education, meaningfulEducation),
    hasList(p.projects, meaningfulProject),
    hasList(p.internships, meaningfulInternship),
    hasList(p.experience, meaningfulExperience),
    hasList(p.skills),
    hasList(p.languages),
    hasList(p.certifications, (c) => nonEmpty(c.name)),
    // The four below were extracted from the start and counted for nothing,
    // because they never reached a card. A researcher whose CV is mostly papers,
    // or a lawyer whose distinguishing fact is a Bar Council number, read as a
    // "thin" profile and got offered the sparse layouts.
    hasList(p.achievements, (a) => nonEmpty(a.title)),
    hasList(p.publications, (pub) => nonEmpty(pub.title)),
    hasList(p.extracurriculars, (e) => nonEmpty(e.activity)),
    hasList(p.registrations, (r) => nonEmpty(r.type) || nonEmpty(r.id)),
    hasText(p.email) || hasText(p.phone) || hasText(p.location),
    hasList(p.socialLinks, meaningfulSocial),
  ];
  return sections.filter(Boolean).length;
}

/**
 * How many grid tiles could be filled. Identity always makes one, so the
 * floor is 1 even on an otherwise empty profile.
 */
export function countFillableTiles(p: CardProfile): number {
  const tiles = [
    true, // identity
    hasList(p.skills),
    hasList(p.education, meaningfulEducation),
    hasList(p.languages),
    hasList(p.projects, meaningfulProject),
    hasText(p.email) || hasText(p.phone) || hasText(p.location),
    hasText(p.bio),
    hasList(p.achievements, (a) => nonEmpty(a.title)),
    hasList(p.publications, (pub) => nonEmpty(pub.title)),
    hasList(p.extracurriculars, (e) => nonEmpty(e.activity)),
  ];
  return tiles.filter(Boolean).length;
}

/**
 * How much content this profile carries in total, in rough rendered lines.
 *
 * Not a section count — a *volume*. Twelve roles with four highlights each fills
 * the same number of sections as one role with one, and produces eight times the
 * card. This is what tells the difference, and it is what a pagination pass would
 * need to decide how many pages a profile actually wants.
 */
export function contentVolume(p: CardProfile): number {
  const lines =
    (nonEmpty(p.bio) ? Math.ceil(p.bio.length / 45) : 0) +
    p.experience.filter(meaningfulExperience).length * 2 +
    p.experience.reduce((n, e) => n + (e.highlights ?? []).filter(nonEmpty).length, 0) +
    p.education.filter(meaningfulEducation).length * 2 +
    p.projects.filter(meaningfulProject).length * 2 +
    p.internships.filter(meaningfulInternship).length * 2 +
    p.certifications.filter((c) => nonEmpty(c.name)).length * 2 +
    p.publications.filter((pub) => nonEmpty(pub.title)).length * 2 +
    p.achievements.filter((a) => nonEmpty(a.title)).length * 2 +
    p.extracurriculars.filter((e) => nonEmpty(e.activity)).length * 2 +
    p.registrations.filter((r) => nonEmpty(r.type)).length +
    Math.ceil(p.skills.length / 3) +
    Math.ceil(p.languages.length / 4);
  return lines;
}

/** Timeline entries carrying a usable sort year. Undated ones don't count. */
export function countDatedEntries(p: CardProfile): number {
  return p.timeline.filter((e) => e.sortYear !== null).length;
}

/* ── Professional-only counting ───────────────────────────────────────────── */

/**
 * Roles that actually carry highlight bullets.
 *
 * `highlights` exists only on the professional schema, so this is the cleanest
 * separator between the two pools: a card gated on it can never be offered to a
 * student, whatever else that student's profile contains.
 */
export function countHighlightedRoles(p: CardProfile): number {
  return p.experience.filter((e) => hasList(e.highlights, nonEmpty)).length;
}

/** Every highlight bullet across every role. Feeds the evidence meters. */
export function countHighlights(p: CardProfile): number {
  return p.experience.reduce((n, e) => n + (e.highlights ?? []).filter(nonEmpty).length, 0);
}

/* ── Skill evidence (Skill Meters, template 14) ───────────────────────────────
 *
 * ⚠️ The bars on that card measure something REAL and nothing else.
 *
 * Nothing in the extraction schema records proficiency — no levels, no years per
 * skill, no self-rating. A bar chart of invented percentages would be the single
 * most damaging thing this template set could ship: it looks authoritative and
 * it is fabricated, and it would be the client's problem the moment a candidate
 * noticed their own card claiming "React 80%".
 *
 * So the bars count evidence instead: how many of the person's own highlight
 * bullets mention that skill. That is a fact about the document, it is stated on
 * the card in words, and it degrades honestly — a skill nobody wrote about gets
 * no bar at all rather than a low one.
 */

/** Letters and digits — the boundary test for a mention. */
function isWordChar(ch: string): boolean {
  return /[\p{L}\p{N}]/u.test(ch);
}

/**
 * How many highlight bullets mention this skill. Each bullet counts at most once.
 *
 * Matching is boundary-checked rather than a bare `includes`, because a
 * substring match is wrong in both directions: "Go" would match "Google" and
 * "AI" would match "detail". `\b` is not usable here — real skills end in
 * punctuation ("Node.js", "C++") and a word boundary sits in the wrong place for
 * them — so the characters on either side are inspected directly.
 *
 * Single-character skills ("R", "C") are skipped: there is no reliable way to
 * tell the language from the letter in prose, and a wrong bar is worse than none.
 */
export function skillMentions(skill: string, p: CardProfile): number {
  const needle = skill.trim().toLowerCase();
  if (needle.length < 2) return 0;

  let hits = 0;
  for (const role of p.experience) {
    for (const raw of role.highlights ?? []) {
      if (!nonEmpty(raw)) continue;
      const hay = raw.toLowerCase();
      let from = 0;
      for (;;) {
        const at = hay.indexOf(needle, from);
        if (at === -1) break;
        const before = at === 0 ? "" : hay[at - 1]!;
        const after = at + needle.length >= hay.length ? "" : hay[at + needle.length]!;
        if (!isWordChar(before) && !isWordChar(after)) {
          hits += 1;
          break; // one bullet, one hit
        }
        from = at + 1;
      }
    }
  }
  return hits;
}

/** Skills with at least one mention, strongest first. Ties keep document order. */
export function measuredSkills(p: CardProfile, max = 5): Array<{ skill: string; count: number }> {
  return p.skills
    .map((skill, i) => ({ skill, count: skillMentions(skill, p), i }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count || a.i - b.i)
    .slice(0, max)
    .map(({ skill, count }) => ({ skill, count }));
}

/**
 * How many of the headline numbers this profile can actually show.
 *
 * A stat strip with one figure in it is not a strip — it is a stray number. Two
 * is the floor, which is why this counts rather than testing a single field.
 * Every one of these is a real count or a stated value; none is derived, so the
 * card never displays a figure the document did not support.
 */
export function countStats(p: CardProfile): number {
  const stats = [
    hasText(p.totalYearsExperience),
    p.experience.filter(meaningfulExperience).length > 0,
    p.certifications.filter((c) => nonEmpty(c.name)).length > 0,
    p.skills.length > 0,
    hasList(p.education, meaningfulEducation),
  ];
  return stats.filter(Boolean).length;
}

/* ── Per-template minimums ────────────────────────────────────────────────── */

interface Minimum {
  /** Human-readable, surfaced to the caller and used in docs. */
  label: string;
  test: (p: CardProfile) => boolean;
  /** Shown when the test fails. */
  reason: (p: CardProfile) => string;
}

/**
 * What each layout needs before it is worth offering.
 *
 * These are deliberately uneven. Whitespace-driven layouts look composed when
 * sparse; structural layouts (a spine, a grid) look broken. Gating is what
 * keeps the ranked recommendation honest rather than a list containing cards
 * that would render badly.
 */
export const MINIMUMS: Record<TemplateKey, Minimum> = {
  "side-rail": {
    label: "Name only",
    test: (p) => hasText(p.fullName),
    reason: () => "Needs at least a name.",
  },
  "centre-portrait": {
    label: "Name only — strongest on thin data",
    test: (p) => hasText(p.fullName),
    reason: () => "Needs at least a name.",
  },
  "hero-split": {
    label: "Name, course/designation, and 2 fillable sections",
    test: (p) => hasText(p.fullName) && countFilledSections(p) >= 2,
    reason: (p) =>
      `The two-column body needs at least 2 fillable sections; this profile has ${countFilledSections(p)}.`,
  },
  "tile-grid": {
    label: "4 fillable tiles",
    test: (p) => countFillableTiles(p) >= 4,
    reason: (p) => `A grid needs at least 4 fillable tiles; this profile has ${countFillableTiles(p)}.`,
  },
  timeline: {
    label: "3 entries with a recoverable year",
    test: (p) => countDatedEntries(p) >= 3,
    reason: (p) =>
      `A timeline needs at least 3 dated entries; this profile has ${countDatedEntries(p)}.`,
  },
  "monogram-block": {
    label: "Name only — the block and the name are the card",
    test: (p) => hasText(p.fullName),
    reason: () => "Needs at least a name.",
  },
  "ticket-stub": {
    label: "Name and 1 fillable section",
    test: (p) => hasText(p.fullName) && countFilledSections(p) >= 1,
    reason: () => "Needs a name and at least one section to fill the stub.",
  },
  "corner-wedge": {
    label: "Name and 1 fillable section",
    test: (p) => hasText(p.fullName) && countFilledSections(p) >= 1,
    reason: () => "Needs a name and at least one section below the wedge.",
  },
  "column-flow": {
    label: "Name and 2 fillable sections",
    test: (p) => hasText(p.fullName) && countFilledSections(p) >= 2,
    reason: (p) =>
      `A two-column flow needs at least 2 fillable sections to flow; this profile has ${countFilledSections(p)}.`,
  },
  "index-ledger": {
    label: "Name and 2 fillable sections",
    test: (p) => hasText(p.fullName) && countFilledSections(p) >= 2,
    reason: (p) =>
      `A ledger needs at least 2 rows below the identity; this profile has ${countFilledSections(p)}.`,
  },

  /* ── professional ──────────────────────────────────────────────────────────
   * Three of these gate on fields the student schema does not have at all
   * (`total_years_experience`, `experience[].highlights`), so they can never be
   * offered to a student profile even by accident.
   */
  "stat-strip": {
    label: "Name, a stated total years of experience, and 2 headline figures",
    // Years is required rather than merely counted: it is the figure the strip
    // opens on, and a strip that leads with "3 CERTS" is not this card. It is
    // also the field the student schema does not have, so requiring it keeps the
    // layout inside its own pool even if the audience filter is ever bypassed.
    test: (p) => hasText(p.fullName) && hasText(p.totalYearsExperience) && countStats(p) >= 2,
    reason: (p) =>
      !hasText(p.totalYearsExperience)
        ? "The strip opens on total years of experience, and this profile does not state it."
        : `The strip needs at least 2 headline figures; this profile supports ${countStats(p)}.`,
  },
  "role-ladder": {
    label: "2 roles",
    test: (p) => p.experience.filter(meaningfulExperience).length >= 2,
    reason: (p) =>
      `A ladder needs at least 2 roles to step between; this profile has ${
        p.experience.filter(meaningfulExperience).length
      }.`,
  },
  letterhead: {
    label: "Name only — strongest on thin data",
    test: (p) => hasText(p.fullName),
    reason: () => "Needs at least a name.",
  },
  "skill-meters": {
    label: "3 skills, and 2 of them mentioned in the role highlights",
    test: (p) => p.skills.length >= 3 && measuredSkills(p).length >= 2,
    reason: (p) => {
      if (p.skills.length < 3) return `The meters need at least 3 skills; this profile has ${p.skills.length}.`;
      if (countHighlightedRoles(p) === 0) {
        return "The bars measure how often a skill appears in the person's own role highlights, so at least one role must carry them. None here do.";
      }
      return `Only ${measuredSkills(p).length} of the listed skills appear in the role highlights, and the bars measure nothing else — 2 are needed before the chart says anything.`;
    },
  },
  "split-halves": {
    label: "Name and 3 fillable sections — both halves must fill",
    test: (p) => hasText(p.fullName) && countFilledSections(p) >= 3,
    reason: (p) =>
      `Two full-height halves need at least 3 sections between them; this profile has ${countFilledSections(
        p,
      )}.`,
  },
  overlap: {
    label: "Name and 2 fillable sections",
    test: (p) => hasText(p.fullName) && countFilledSections(p) >= 2,
    reason: (p) =>
      `The overlapping plate needs content behind and below it; this profile fills ${countFilledSections(
        p,
      )} sections.`,
  },
  numbered: {
    label: "Name and 3 fillable sections — the numerals need something to number",
    test: (p) => hasText(p.fullName) && countFilledSections(p) >= 3,
    reason: (p) =>
      `Numbered sections need at least 3 of them; this profile fills ${countFilledSections(p)}.`,
  },
  "folder-tab": {
    label: "Name only",
    test: (p) => hasText(p.fullName),
    reason: () => "Needs at least a name.",
  },
  "edge-spine": {
    label: "Name and 2 fillable sections",
    test: (p) => hasText(p.fullName) && countFilledSections(p) >= 2,
    reason: (p) =>
      `A spine beside an empty body is a strip, not a card; this profile fills ${countFilledSections(
        p,
      )} sections.`,
  },
  "pull-quote": {
    // The only layout in the 20 that depends on Module 3 having run (or on the
    // CV carrying a real summary). The quote IS the card — there is no version
    // of it without one, so this gates on the bio rather than degrading.
    label: "Name and a bio or summary — the quote is the card",
    test: (p) => hasText(p.fullName) && hasText(p.bio),
    reason: () =>
      "The whole layout is the person's own positioning line set large, and this profile has no summary. Running enhancement first unlocks it.",
  },

  /* ── professional avatar cards ───────────────────────────────────────────────
   * Both need a real body under the identity — a badge or a portrait over an
   * empty card is a sticker, not a profile. Requiring 2 sections also keeps them
   * out of the thin pool, where the sparse-by-design layouts belong.
   */
  badge: {
    label: "Name and 2 fillable sections",
    test: (p) => hasText(p.fullName) && countFilledSections(p) >= 2,
    reason: (p) =>
      `A badge over an empty body is a sticker; this profile fills ${countFilledSections(p)} sections.`,
  },
  spotlight: {
    label: "Name and 2 fillable sections",
    test: (p) => hasText(p.fullName) && countFilledSections(p) >= 2,
    reason: (p) =>
      `A portrait over an empty body is a stub; this profile fills ${countFilledSections(p)} sections.`,
  },
};

/** Can this profile fill this template? */
export function meetsMinimum(key: TemplateKey, profile: CardProfile): boolean {
  return MINIMUMS[key].test(profile);
}

export function minimumLabel(key: TemplateKey): string {
  return MINIMUMS[key].label;
}

/**
 * Eligibility for one template, with the reason when it fails.
 *
 * The reason is what lets the caller explain an exclusion instead of silently
 * returning a shorter list.
 */
export function eligibilityFor(
  key: TemplateKey,
  profile: CardProfile,
  info: { id: number; name: string },
): TemplateEligibility {
  const min = MINIMUMS[key];
  const ok = min.test(profile);
  return {
    id: info.id,
    key,
    name: info.name,
    eligible: ok,
    reason: ok ? null : min.reason(profile),
  };
}

/* ── Data level ───────────────────────────────────────────────────────────── */

export type DataLevel = "rich" | "typical" | "thin";

/**
 * How much this profile actually carries. Cards are designed at all three
 * levels; the recommender uses it to prefer layouts that suit the density.
 */
export function dataLevel(p: CardProfile): DataLevel {
  const filled = countFilledSections(p);
  if (filled >= 7) return "rich";
  if (filled >= 3) return "typical";
  return "thin";
}
