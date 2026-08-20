/**
 * Which layouts to actually SUGGEST — a short, ranked, explained list.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * Eligibility (guards.ts) answers "could this profile fill this card?" and for a
 * rich profile the answer is yes to nearly all ten. Handing a user ten cards is
 * not a recommendation, it is a catalogue. This file answers the narrower and
 * more useful question: "which two or three should we put in front of them?"
 *
 * ── ⚠️ No fit percentages. Ever. ───────────────────────────────────────────
 * An earlier version of the demo page showed invented scores like "TMP-101 · 94%".
 * It was removed because it was a lie with a decimal point in it: there is no
 * ground truth for how well a layout suits a person, so any percentage is made-up
 * precision dressed as measurement — the same trap as putting proficiency bars on
 * Skill Meters.
 *
 * What this returns instead is honest about what it is:
 *   - a RANK, which is a real claim (this one before that one)
 *   - a coarse TIER of three values, which cannot imply precision it lacks
 *   - REASONS in plain sentences, every one a checkable fact about the profile
 *     ("4 of the listed skills appear in the role highlights")
 *
 * `score` is exposed for debugging and for stable ordering. It is a count of
 * points from the rules below — not a percentage, not out of anything, and it
 * must not be shown to an end user as though it were a measurement.
 *
 * ⚠️ SELF-CONTAINED: imports nothing outside `templates/`.
 */

import type { CardProfile, TemplateEligibility, TemplateInfo, TemplateKey } from "./types";
import {
  countDatedEntries,
  countFillableTiles,
  countFilledSections,
  countHighlights,
  countStats,
  dataLevel,
  meaningfulEducation,
  meaningfulExperience,
  meaningfulInternship,
  meaningfulProject,
  meaningfulSocial,
  measuredSkills,
  type DataLevel,
} from "./guards";
import { nonEmpty } from "./helpers";

/** Coarse on purpose. Three buckets cannot pretend to a precision they lack. */
export type FitTier = "strong" | "good" | "possible";

export interface Suggestion {
  id: number;
  key: TemplateKey;
  name: string;
  /** 1 is the best match. Contiguous within the returned list. */
  rank: number;
  tier: FitTier;
  /**
   * Internal points behind the ordering. NOT a percentage and NOT out of
   * anything — never render this as a fit score.
   */
  score: number;
  /** Plain sentences, each a checkable fact about this profile. */
  reasons: string[];
}

/* ── Facts ────────────────────────────────────────────────────────────────── */

/**
 * Everything the rules are allowed to look at, counted once.
 *
 * Computed up front so twenty rule functions cannot each re-derive the same
 * numbers slightly differently — and so every reason string quotes a number that
 * came from the same place as the points it justifies.
 */
export interface ProfileFacts {
  level: DataLevel;
  sections: number;
  tiles: number;
  dated: number;
  skills: number;
  /** Skills that actually appear in the role highlights. */
  measured: number;
  roles: number;
  highlights: number;
  certs: number;
  degrees: number;
  projects: number;
  internships: number;
  languages: number;
  socials: number;
  /** Headline figures Stat Strip could show. */
  stats: number;
  bioChars: number;
  contactFields: number;
  hasWebsite: boolean;
  nameChars: number;
}

export function profileFacts(p: CardProfile): ProfileFacts {
  return {
    level: dataLevel(p),
    sections: countFilledSections(p),
    tiles: countFillableTiles(p),
    dated: countDatedEntries(p),
    skills: p.skills.length,
    measured: measuredSkills(p, 99).length,
    roles: p.experience.filter(meaningfulExperience).length,
    highlights: countHighlights(p),
    certs: p.certifications.filter((c) => nonEmpty(c.name)).length,
    degrees: p.education.filter(meaningfulEducation).length,
    projects: p.projects.filter(meaningfulProject).length,
    internships: p.internships.filter(meaningfulInternship).length,
    languages: p.languages.length,
    socials: p.socialLinks.filter(meaningfulSocial).length,
    stats: countStats(p),
    bioChars: nonEmpty(p.bio) ? p.bio.trim().length : 0,
    contactFields: [p.email, p.phone, p.location].filter(nonEmpty).length,
    hasWebsite: nonEmpty(p.website),
    nameChars: nonEmpty(p.fullName) ? p.fullName.trim().length : 0,
  };
}

/* ── Rules ────────────────────────────────────────────────────────────────── */

/**
 * How much content a layout is at its best with.
 *
 * This is the single biggest signal and the one the client's own feedback points
 * at: a whitespace-driven card looks composed on a thin profile and empty on a
 * rich one, and a dense card is the reverse. It is deliberately separate from the
 * hard minimum in guards.ts — a minimum says "will not break", an appetite says
 * "is at its best".
 */
type Appetite = "sparse" | "moderate" | "dense";

const APPETITE_POINTS: Record<Appetite, Record<DataLevel, number>> = {
  sparse: { thin: 4, typical: 2, rich: 0 },
  moderate: { thin: 1, typical: 4, rich: 3 },
  dense: { thin: 0, typical: 2, rich: 4 },
};

const APPETITE_REASON: Record<Appetite, Partial<Record<DataLevel, string>>> = {
  sparse: {
    thin: "Built for a short profile — the space is part of the design, not a gap.",
    typical: "Comfortable at this amount of content.",
  },
  moderate: {
    typical: "Suits this amount of content closely.",
    rich: "Holds a full profile without crowding.",
  },
  dense: {
    rich: "Designed for a full profile, and this one is full.",
    typical: "Workable, though it has room for more than this profile carries.",
  },
};

/** A points-and-reason pair. Points with no reason are not allowed. */
type Signal = [points: number, reason: string];

interface FitRule {
  appetite: Appetite;
  /** Template-specific signals, each justified in words. */
  signals?: (f: ProfileFacts) => Array<Signal | null>;
}

/** `n` with a singular/plural noun — reasons read as sentences, not as data. */
function n(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

const RULES: Record<TemplateKey, FitRule> = {
  /* ── student ───────────────────────────────────────────────────────────── */
  "side-rail": {
    appetite: "moderate",
    signals: (f) => [
      f.contactFields >= 2 ? [2, `The rail fills with ${n(f.contactFields, "contact detail")}.`] : null,
      f.languages + f.socials >= 2 ? [1, "Languages and links have somewhere to sit in the rail."] : null,
    ],
  },
  "hero-split": {
    appetite: "dense",
    signals: (f) => [
      f.sections >= 4 ? [2, `${n(f.sections, "section")} — enough for both columns of the body.`] : null,
      f.skills > 0 && (f.projects > 0 || f.internships > 0)
        ? [1, "Skills on one side, projects or internships on the other."]
        : null,
    ],
  },
  "centre-portrait": {
    appetite: "sparse",
    signals: (f) => [
      f.sections <= 3 ? [2, "Little enough content that the centred column stays composed."] : null,
      f.bioChars > 0 ? [1, "A summary to carry the middle of the card."] : null,
    ],
  },
  timeline: {
    appetite: "dense",
    signals: (f) => [
      f.dated >= 6
        ? [3, `${n(f.dated, "dated entry", "dated entries")} make a real sequence down the spine.`]
        : f.dated >= 4
          ? [2, `${n(f.dated, "dated entry", "dated entries")} to put on the spine.`]
          : null,
    ],
  },
  "tile-grid": {
    appetite: "dense",
    signals: (f) => [
      f.tiles >= 6 ? [3, `${n(f.tiles, "tile")} fill the grid.`] : null,
      f.tiles % 2 === 0 ? [1, "An even number of tiles, so the rows close cleanly."] : null,
    ],
  },
  "ticket-stub": {
    appetite: "moderate",
    signals: (f) => [
      f.sections >= 2 && f.sections <= 5
        ? [2, "Enough on the stub to read as content, without crowding the tear."]
        : null,
      f.contactFields >= 1 ? [1, "Contact details for the ticket top to carry."] : null,
    ],
  },
  "corner-wedge": {
    appetite: "moderate",
    signals: (f) => [
      f.sections <= 4 ? [2, "Short enough that the wedge stays clear of the body text."] : null,
      f.skills > 0 ? [1, "Skills to fill the narrow column beside the wedge."] : null,
    ],
  },
  "monogram-block": {
    appetite: "sparse",
    signals: (f) => [
      f.sections <= 3 ? [2, "Suits a short profile — the block and the name are the card."] : null,
      f.nameChars > 0 && f.nameChars <= 22 ? [1, "A name short enough to sit beside the block."] : null,
    ],
  },
  "index-ledger": {
    appetite: "dense",
    signals: (f) => [
      f.sections >= 5 ? [2, `${n(f.sections, "row")} in the ledger.`] : null,
      f.contactFields >= 2 ? [1, "Contact details to fill the label gutter."] : null,
    ],
  },
  "column-flow": {
    appetite: "dense",
    signals: (f) => [
      f.sections >= 5 ? [2, "Enough sections to flow from one column into the next."] : null,
      f.projects + f.internships >= 3 ? [1, "Plenty of short entries, which is what flows well."] : null,
    ],
  },

  /* ── professional ──────────────────────────────────────────────────────── */
  "skill-meters": {
    appetite: "moderate",
    signals: (f) => [
      f.measured >= 4
        ? [3, `${n(f.measured, "skill")} appear in the role highlights, so the chart has real range.`]
        : f.measured >= 2
          ? [1, `${n(f.measured, "skill")} appear in the role highlights.`]
          : null,
      f.highlights >= 4 ? [1, `${n(f.highlights, "highlight")} behind the counts.`] : null,
    ],
  },
  "split-halves": {
    appetite: "dense",
    signals: (f) => [
      f.sections >= 5 ? [3, `${n(f.sections, "section")} — enough to fill both halves.`] : null,
      f.skills >= 4 && f.certs >= 1 ? [1, "Skills and certifications give the coloured half its own content."] : null,
    ],
  },
  overlap: {
    appetite: "moderate",
    signals: (f) => [
      f.stats >= 2 ? [2, "Standing facts for the band above the plate."] : null,
      f.contactFields >= 2 ? [1, "Contact details for the raised plate."] : null,
    ],
  },
  numbered: {
    appetite: "dense",
    signals: (f) => [
      f.sections >= 5 ? [3, `${n(f.sections, "section")} to number.`] : null,
      f.sections >= 7 ? [1, "Long enough that the numbering becomes the structure."] : null,
    ],
  },
  "folder-tab": {
    appetite: "sparse",
    signals: (f) => [
      f.nameChars > 0 && f.nameChars <= 24 ? [2, "A name that fits the tab on one line."] : null,
      f.sections <= 4 ? [1, "A short body, which is what a folder tab suits."] : null,
    ],
  },
  "stat-strip": {
    appetite: "moderate",
    signals: (f) => [
      f.stats >= 3 ? [3, "Three headline figures, which is what the strip is built for."] : null,
      f.roles >= 2 ? [1, `${n(f.roles, "role")} behind the figures.`] : null,
    ],
  },
  "role-ladder": {
    appetite: "moderate",
    signals: (f) => [
      f.roles >= 3 ? [3, `${n(f.roles, "role")} make a visible staircase.`] : null,
      f.highlights >= f.roles && f.roles > 0 ? [1, "Every rung has a line of detail under it."] : null,
    ],
  },
  letterhead: {
    appetite: "sparse",
    signals: (f) => [
      f.contactFields >= 2 ? [2, "Enough contact detail for the header's right-hand column."] : null,
      f.sections <= 4 ? [1, "Short enough to read as stationery rather than as a page of text."] : null,
    ],
  },
  "edge-spine": {
    appetite: "moderate",
    signals: (f) => [
      f.nameChars > 0 && f.nameChars <= 26 ? [2, "A name that fits the spine on one line."] : null,
      f.sections >= 3 ? [1, "Enough body content to balance the spine."] : null,
    ],
  },
  "pull-quote": {
    appetite: "moderate",
    signals: (f) => [
      f.bioChars >= 140
        ? [4, "A summary long enough to carry the card as display type."]
        : f.bioChars >= 80
          ? [3, "A summary with enough in it to set large."]
          : [1, "A short summary — the quote will be brief."],
    ],
  },

  /* ── professional avatar cards ───────────────────────────────────────────── */
  badge: {
    appetite: "moderate",
    signals: (f) => [
      f.contactFields >= 2 ? [2, `${n(f.contactFields, "contact detail")} to fill the badge line.`] : null,
      f.roles >= 1 ? [1, `${n(f.roles, "role")} to carry the body under the badge.`] : null,
    ],
  },
  spotlight: {
    appetite: "moderate",
    signals: (f) => [
      f.bioChars > 0 ? [2, "A summary to sit beside the portrait."] : null,
      f.nameChars > 0 && f.nameChars <= 24 ? [1, "A name short enough to sit beside the portrait."] : null,
    ],
  },
};

/* ── Tiers ────────────────────────────────────────────────────────────────── */

/*
 * Absolute thresholds, not relative to the best match. Relative banding would
 * label the top of a weak field "strong", which is exactly the kind of quiet
 * overclaim this file exists to avoid: a thin profile should be told its options
 * are workable, not that they are ideal.
 *
 * The scale runs 0–8: up to 4 from appetite, up to 4 from the signals.
 */
const STRONG_AT = 6;
const GOOD_AT = 4;

function tierFor(score: number): FitTier {
  if (score >= STRONG_AT) return "strong";
  if (score >= GOOD_AT) return "good";
  return "possible";
}

/* ── Ranking ──────────────────────────────────────────────────────────────── */

function scoreOne(key: TemplateKey, facts: ProfileFacts): { score: number; reasons: string[] } {
  const rule = RULES[key];
  const base = APPETITE_POINTS[rule.appetite][facts.level];
  const baseReason = APPETITE_REASON[rule.appetite][facts.level];

  const reasons: string[] = baseReason ? [baseReason] : [];
  let score = base;

  for (const signal of rule.signals?.(facts) ?? []) {
    if (!signal) continue;
    score += signal[0];
    reasons.push(signal[1]);
  }

  return { score, reasons };
}

/**
 * Every eligible template for this profile, best first.
 *
 * Ineligible ones are absent rather than ranked last — a card that cannot be
 * filled is not a worse suggestion, it is not a suggestion. Their reasons are
 * already available from `eligibleTemplates()`.
 *
 * Ties break by catalogue id so the order is deterministic: the same profile must
 * produce the same ranking on every call, or server and client renders disagree
 * and the tests only pass by luck.
 */
export function rankTemplates(
  profile: CardProfile,
  pool: TemplateInfo[],
  eligibility: TemplateEligibility[],
): Suggestion[] {
  const facts = profileFacts(profile);
  const eligible = new Set(eligibility.filter((e) => e.eligible).map((e) => e.key));

  return pool
    .filter((t) => eligible.has(t.key))
    .map((t) => {
      const { score, reasons } = scoreOne(t.key, facts);
      return { id: t.id, key: t.key, name: t.name, score, tier: tierFor(score), reasons, rank: 0 };
    })
    .sort((a, b) => b.score - a.score || a.id - b.id)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

/**
 * How many layouts to put in front of a user. **Three**, set by the owner on
 * 11 Aug 2026 — not a tunable.
 *
 * It is a product decision, not a technical one, so it lives here as one constant
 * rather than as a request parameter: a caller that could ask for twelve would
 * turn the recommendation back into the catalogue this file exists to replace.
 */
export const SUGGESTION_COUNT = 3;

/** The short list: the top three, ranked and explained. */
export function topSuggestions(ranked: Suggestion[]): Suggestion[] {
  return ranked.slice(0, SUGGESTION_COUNT);
}
