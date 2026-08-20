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
 *
 * ── Pagination (20 Aug 2026) ────────────────────────────────────────────────
 * The masthead is fixed chrome and the sections are the flowing blocks, but the
 * body is a genuine two-column FLOW (`.iv-cf-flow`), so the card renders page 1
 * itself via `firstPage` — the columns container survives intact. Overflow
 * sections flow to single-column continuation pages. `sections()` is the one
 * ordered list both `build()` and `paged()` consume.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { esc, nonEmpty } from "../helpers";
import { joinBlocks, section } from "../guards";
import { linesForItems, linesForText, type PageBlock, type PagedContent } from "../pagination";
import {
  achievementList,
  bio,
  certificationList,
  chips,
  contactInline,
  educationList,
  extracurricularList,
  internshipList,
  projectList,
  publicationList,
} from "../sections";

/**
 * The body sections, in order — the one list both paths use. Order matters here
 * in a way it does not on a stacked card: this is the sequence the flow follows
 * down column one and into column two.
 */
function sections(p: CardProfile): PageBlock[] {
  const out: PageBlock[] = [];
  const add = (html: string, weight: number) => {
    if (html.trim()) out.push({ html, weight });
  };
  add(section("About", () => bio(p, SHOW.bioChars)), linesForText(p.bio));
  add(section("Education", () => educationList(p, SHOW.education)), linesForItems(p.education.length));
  add(section("Certifications", () => certificationList(p, SHOW.certifications)), linesForItems(p.certifications.length));
  add(section("Projects", () => projectList(p, SHOW.projects)), linesForItems(p.projects.length, 3));
  add(section("Internships", () => internshipList(p, SHOW.internships)), linesForItems(p.internships.length));
  add(section("Skills", () => chips(p.skills, SHOW.skills)), Math.ceil(p.skills.length / 3) + 1);
  add(section("Languages", () => chips(p.languages, SHOW.languages)), Math.ceil(p.languages.length / 4) + 1);
  add(section("Awards", () => achievementList(p, SHOW.achievements)), linesForItems(p.achievements.length));
  add(section("Publications", () => publicationList(p, SHOW.publications)), linesForItems(p.publications.length));
  add(section("Activities", () => extracurricularList(p, SHOW.extracurriculars)), linesForItems(p.extracurriculars.length));
  return out;
}

function masthead(p: CardProfile): string {
  return `<header class="iv-cf-mast">
      ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
      ${nonEmpty(p.designation) ? `<div class="iv-role">${esc(p.designation)}</div>` : ""}    </header>`;
}

/** Page 1: the masthead, the two-column flow of the sections that fit, and the
 *  contact footer. Reproduces the card's designed layout exactly. */
function firstPage(p: CardProfile, fit: PageBlock[]): string {
  const body = joinBlocks(fit.map((b) => b.html));
  const contact = contactInline(p);
  const foot = contact ? `<footer class="iv-cf-foot">${contact}</footer>` : "";
  return `<div class="iv-cf-wrap">${masthead(p)}<main class="iv-cf-flow">${body}</main>${foot}</div>`;
}

function build(p: CardProfile): string {
  // Single-page fallback: the masthead and every section in the flow.
  return firstPage(p, sections(p));
}

function paged(p: CardProfile, _theme: ResolvedTheme): PagedContent {
  return {
    firstPage: (fit) => firstPage(p, fit),
    slim: nonEmpty(p.fullName) ? esc(p.fullName) : "",
    blocks: sections(p),
    chromeWeight: 3, // the masthead
  };
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

/* Continuation pages (2+) hold overflow sections as a single-column stack — no
   masthead, no flow — so they take the padding the iv-cf-wrap gives page 1. */
${s} .iv-page-cont{padding:1.1em 1.05em}
${s} .iv-page-cont .iv-sec-h:first-of-type{margin-top:0}
</style>`;
}

export const columnFlow = { build, styles, paged };
