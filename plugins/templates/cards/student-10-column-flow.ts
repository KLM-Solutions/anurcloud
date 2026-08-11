/**
 * Student template 10 — "Column Flow" (DEV-3045)
 *
 *   ┌──────────────────────────┐
 *   │  KARTHICK R              │
 *   │  BTech Information Tech  │
 *   │ ════════════════════════ │  ← masthead rule
 *   │ EDUCATION  │ INTERNSHIPS │
 *   │ BTech, IT  │ CSUIT LABS  │
 *   │ Higher Sec │ SKILLS      │
 *   │ PROJECTS   │ HTML · CSS  │
 *   │ Weather App│             │
 *   └──────────────────────────┘
 *       ^ content FLOWS across 2 columns
 *
 * ── Why this layout exists ─────────────────────────────────────────────────
 * The replacement for a first attempt ("Portrait Panel") that hit every point of
 * Mithra's 3 Aug 2026 note — vertical stack, banner on top, circular initials
 * avatar, white body below. A deep panel instead of a thin band is a change of
 * proportion, not of structure, and would have counted as one more of the same.
 *
 * This one has none of the four:
 *   - no colour block anywhere; the brand appears only in the rule and headings
 *   - no avatar at all, circular or otherwise
 *   - a newspaper masthead rather than a banner
 *   - the body is a genuine multi-column FLOW: sections run down column one and
 *     continue into column two, so the break lands wherever the content happens
 *     to reach
 *
 * That last point is what separates it from Hero Split, whose two columns are
 * fixed panels with assigned content. Nothing else in the set flows.
 *
 * ── The one hard rule ─────────────────────────────────────────────────────
 * `break-inside: avoid` on every block. Without it a multi-column flow will split
 * an education entry down the middle, leaving the institution in column one and
 * the year in column two — which reads as a rendering bug rather than a layout.
 *
 * Thin data: with little content the flow collapses to one short column, which
 * still reads as a masthead document. Minimum: name + 2 fillable sections, below
 * which there is nothing to flow.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { esc, logoSlot, nonEmpty } from "../helpers";
import { joinBlocks, section } from "../guards";
import {
  achievementList,
  bio,
  chips,
  contactInline,
  educationList,
  extracurricularList,
  internshipList,
  projectList,
  publicationList,
} from "../sections";

function build(p: CardProfile, theme: ResolvedTheme): string {
  const contact = contactInline(p);

  const masthead = `<header class="iv-cf-mast">
      ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
      ${nonEmpty(p.designation) ? `<div class="iv-role">${esc(p.designation)}</div>` : ""}
      ${logoSlot(theme.logo)}
    </header>`;

  // Order matters here in a way it does not on a stacked card: this is the
  // sequence the flow will follow down column one and into column two.
  const body = joinBlocks([
    section("About", () => bio(p, SHOW.bioChars)),
    section("Education", () => educationList(p, SHOW.education)),
    section("Projects", () => projectList(p, SHOW.projects)),
    section("Internships", () => internshipList(p, SHOW.internships)),
    section("Skills", () => chips(p.skills, SHOW.skills)),
    section("Languages", () => chips(p.languages, SHOW.languages)),
    section("Awards", () => achievementList(p, SHOW.achievements)),
    section("Publications", () => publicationList(p, SHOW.publications)),
    section("Activities", () => extracurricularList(p, SHOW.extracurriculars)),
  ]);

  const foot = contact ? `<footer class="iv-cf-foot">${contact}</footer>` : "";

  return `<div class="iv-cf-wrap">${masthead}<main class="iv-cf-flow">${body}</main>${foot}</div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
/* No colour block and no avatar — the brand shows only in the rule and the
   section headings. That is the point: see the header comment. */
${s}.iv-column-flow{background:var(--iv-surface)}
${s} .iv-cf-wrap{display:flex;flex-direction:column;min-height:100%;padding:1.1em 1.05em}

${s} .iv-cf-mast{border-bottom:3px double var(--iv-primary);padding-bottom:.5em;margin-bottom:.7em}
${s} .iv-cf-mast .iv-name{font-size:1.5em;line-height:1.1;text-transform:uppercase;letter-spacing:-.005em}
${s} .iv-cf-mast .iv-role{font-size:.72em;letter-spacing:.04em;text-transform:uppercase}

/* The actual flow. column-fill:balance keeps a short profile from stacking
   everything into column one and leaving column two empty. */
${s} .iv-cf-flow{flex:1 1 auto;columns:2;column-gap:1.05em;column-fill:balance;column-rule:1px solid color-mix(in srgb,var(--iv-muted) 22%,transparent)}
/* Load-bearing: without this the flow splits an entry across the column break,
   stranding the institution in one column and the year in the other. */
${s} .iv-cf-flow>*,${s} .iv-cf-flow .iv-item,${s} .iv-cf-flow .iv-sec-h{break-inside:avoid;-webkit-column-break-inside:avoid}
/* A heading must never be the last thing in a column, orphaned from its list. */
${s} .iv-cf-flow .iv-sec-h{break-after:avoid;margin-top:.75em}
${s} .iv-cf-flow>*:first-child .iv-sec-h,${s} .iv-cf-flow .iv-sec-h:first-child{margin-top:0}
${s} .iv-cf-flow .iv-bio{margin-top:0;font-size:.76em}
${s} .iv-cf-flow .iv-item-t{font-size:.78em}

${s} .iv-cf-foot{margin-top:.8em;padding-top:.5em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 22%,transparent)}
${s} .iv-cf-foot .iv-cinline{font-size:.68em}

/* Two columns inside ~300px gives four-word lines; drop to one and keep the
   masthead, which is where this layout's identity actually lives. */
@container (max-width:320px){
  ${s} .iv-cf-flow{columns:1;column-rule:none}
}


/* The logo's dedicated row on this card. */
${s} .iv-cf-wrap>.iv-logo-slot{margin-bottom:.55em}
</style>`;
}

export const columnFlow = { build, styles };
