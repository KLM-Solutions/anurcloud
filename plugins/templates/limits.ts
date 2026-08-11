/**
 * How much of each section a card shows — one dial, not twenty.
 *
 * ── Why this file exists ───────────────────────────────────────────────────
 * Every card used to carry its own hardcoded caps: two roles, one education line,
 * two certifications, eight skills, a bio truncated at 160 characters. On a
 * junior CV that is invisible. On a senior one it is destructive — an eighteen-year
 * career with four employers and a dozen achievements rendered as two jobs and a
 * degree, and the person looked less accomplished on their card than on the
 * document it was built from (client report, 11 Aug 2026).
 *
 * The numbers below are the *display* ceiling, deliberately generous. Cleaning in
 * `lib/profile-to-card.ts` keeps far more than this, so raising a number here
 * shows more without re-extracting anything.
 *
 * ── These are not the structural limits ────────────────────────────────────
 * A few cards cap lower because their layout genuinely cannot take more — Role
 * Ladder has four rungs before the indent runs out of card, Stat Strip has three
 * cells, Split Halves has half the width to work in. Those live in the card and
 * say why. This file is for "how much content is enough", not "what fits".
 *
 * ── Relationship to pagination ─────────────────────────────────────────────
 * A ceiling is a blunt instrument: it drops content rather than continuing it.
 * These numbers are set so a genuinely heavy profile produces a tall card rather
 * than a truncated one, which is the honest failure of the two. Splitting that
 * tall card across pages is the next piece of work; when it lands, most of these
 * ceilings can rise again or go away.
 */

export const SHOW = {
  /** Roles on a professional card, and bullets under each. */
  roles: 6,
  highlightsPerRole: 4,

  projects: 5,
  internships: 4,
  education: 4,
  certifications: 5,

  /** The four families that used to be dropped entirely. */
  achievements: 5,
  publications: 5,
  extracurriculars: 4,
  registrations: 3,

  skills: 18,
  languages: 8,
  socials: 6,
  websites: 3,

  /** Rows on the Timeline spine. */
  timeline: 14,

  /**
   * Bio truncation, in characters.
   *
   * Module 3 writes two to three sentences, so this is set to hold a whole one
   * rather than to trim it. Cards that set their own lower number do it for
   * typographic reasons — a compact header, or display type — and say so.
   */
  bioChars: 320,
} as const;

/**
 * The same dial for a column at roughly half the card's width — a tile, a rail, a
 * half, the aside beside a wedge.
 *
 * Eighteen skill chips read as a useful list across a 380px card and as a wall
 * inside a 170px tile. This is a layout constraint, not an editorial one, which is
 * why it is a second set of numbers rather than a smaller value of the first.
 */
export const NARROW = {
  roles: 3,
  highlightsPerRole: 1,
  projects: 3,
  internships: 2,
  education: 2,
  certifications: 3,
  achievements: 3,
  publications: 3,
  extracurriculars: 2,
  registrations: 2,
  skills: 8,
  languages: 5,
} as const;
