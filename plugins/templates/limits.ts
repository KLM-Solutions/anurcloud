/**
 * How much of each section a card shows.
 *
 * ── Owner decision, 20 Aug 2026: NO display caps ───────────────────────────
 * Every extracted field must appear on the card **in full** — all items, no
 * truncation. Nothing the resume contains may be silently dropped at render
 * time. So every dial below is `UNLIMITED`: cards keep calling `SHOW.skills`,
 * `NARROW.roles`, etc., but each now means "show them all".
 *
 * The count caps that used to live here (skills 18, roles 6, projects 5, …) are
 * gone on purpose. The consequence is that a rich profile produces a **tall**
 * card; splitting that across pages is the pagination work (see plugins/CLAUDE.md
 * "Pagination" and docs/anur-cloud/todos.md #3). Dropping content to keep a card
 * short is no longer acceptable — a tall card is the honest outcome.
 *
 * ── Structural limits are a different thing ────────────────────────────────
 * A few cards had layout-driven caps in their own file (Role Ladder's rungs,
 * Stat Strip's cells). Those are being relaxed too as part of "show everything";
 * where a layout genuinely cannot hold more it must grow, not truncate.
 */

/** Every dial is uncapped — render all items. */
const UNLIMITED = Number.POSITIVE_INFINITY;

export const SHOW = {
  roles: UNLIMITED,
  highlightsPerRole: UNLIMITED,

  projects: UNLIMITED,
  internships: UNLIMITED,
  education: UNLIMITED,
  certifications: UNLIMITED,

  achievements: UNLIMITED,
  publications: UNLIMITED,
  extracurriculars: UNLIMITED,
  registrations: UNLIMITED,

  skills: UNLIMITED,
  languages: UNLIMITED,
  socials: UNLIMITED,
  websites: UNLIMITED,

  timeline: UNLIMITED,

  /** Bio is shown in full — no character truncation. */
  bioChars: UNLIMITED,
} as const;

/**
 * Kept as a separate export so the many `NARROW.*` call sites in half-width
 * columns still compile — but it is now identical to `SHOW`: uncapped. A narrow
 * column therefore grows taller rather than dropping items.
 */
export const NARROW = {
  roles: UNLIMITED,
  highlightsPerRole: UNLIMITED,
  projects: UNLIMITED,
  internships: UNLIMITED,
  education: UNLIMITED,
  certifications: UNLIMITED,
  achievements: UNLIMITED,
  publications: UNLIMITED,
  extracurriculars: UNLIMITED,
  registrations: UNLIMITED,
  skills: UNLIMITED,
  languages: UNLIMITED,
} as const;
