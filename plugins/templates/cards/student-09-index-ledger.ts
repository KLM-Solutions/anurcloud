/**
 * Student template 9 — "Index Ledger" (DEV-3044)
 *
 *   ┌──────────┬───────────────┐
 *   │     NAME │ Karthick R    │
 *   │   COURSE │ BTech IT      │
 *   │──────────┼───────────────│
 *   │EDUCATION │ BTech, IT     │
 *   │          │ Higher Sec.   │
 *   │ PROJECTS │ Weather App   │
 *   │   SKILLS │ HTML · CSS    │
 *   └──────────┴───────────────┘
 *      ^ right-aligned label gutter
 *
 * Structurally: a spec sheet. A narrow right-aligned label gutter runs down the
 * left, values in the wide column beside it, one hairline per row. Section
 * headings do not sit above their content anywhere on this card — they sit
 * beside it, which no other layout in the set does.
 *
 * Centre Portrait is the other card with no colour block, and it is deliberately
 * nothing like this one: centred vs. left-aligned, headings above vs. beside,
 * generous vs. dense. In grayscale they read as different documents.
 *
 * ── The label gutter and long words ───────────────────────────────────────
 * A fixed gutter is what makes the alignment read as a ledger, so it cannot flex
 * with content. That means the value column is narrow, and an email or a long
 * institution name must be allowed to break — `overflow-wrap:anywhere` on the
 * value cell, not on the card, so headings never break mid-word.
 *
 * Thin data: rows simply do not render. Two rows still look like a ledger.
 * Minimum: name + 2 fillable sections.
 */

import type { CardProfile } from "../types";
import { SHOW } from "../limits";
import { esc, nonEmpty, joinParts } from "../helpers";
import {
  achievementList,
  bio,
  chips,
  educationList,
  extracurricularList,
  internshipList,
  projectList,
  publicationList,
} from "../sections";

/** One ledger row. Returns "" when the value is empty, so rows self-remove. */
function row(label: string, value: string): string {
  if (!value.trim()) return "";
  return `<div class="iv-il-row"><div class="iv-il-k">${esc(
    label,
  )}</div><div class="iv-il-v">${value}</div></div>`;
}

function build(p: CardProfile): string {
  const identity = [
    row("Name", nonEmpty(p.fullName) ? `<span class="iv-name">${esc(p.fullName)}</span>` : ""),
    row("Course", nonEmpty(p.designation) ? esc(p.designation) : ""),
    row(
      "Contact",
      joinParts(
        [
          nonEmpty(p.email) ? esc(p.email) : null,
          nonEmpty(p.phone) ? esc(p.phone) : null,
          nonEmpty(p.location) ? esc(p.location) : null,
        ],
        " · ",
      ),
    ),
  ].join("");

  const detail = [
    row("About", bio(p, SHOW.bioChars)),
    row("Education", educationList(p, SHOW.education)),
    row("Projects", projectList(p, SHOW.projects)),
    row("Internships", internshipList(p, SHOW.internships)),
    row("Awards", achievementList(p, SHOW.achievements)),
    row("Papers", publicationList(p, SHOW.publications)),
    row("Activities", extracurricularList(p, SHOW.extracurriculars)),
    row("Skills", chips(p.skills, SHOW.skills)),
    row("Languages", chips(p.languages, SHOW.languages)),
  ].join("");

  return `<div class="iv-il-wrap"><div class="iv-il-head">${identity}</div><div class="iv-il-body">${detail}</div></div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
/* No colour block anywhere — hierarchy comes from alignment and rule weight.
   The primary colour appears only in the label gutter and the top rule. */
${s}.iv-index-ledger{background:var(--iv-surface)}
${s} .iv-il-wrap{padding:1.15em 1.05em}

${s} .iv-il-row{display:flex;gap:.75em;align-items:baseline;padding:.4em 0}
${s} .iv-il-row+.iv-il-row{border-top:1px solid color-mix(in srgb,var(--iv-muted) 15%,transparent)}

/* Fixed, right-aligned gutter — flexing it would break the ledger alignment
   that is the entire identity of this layout. */
${s} .iv-il-k{flex:0 0 5.6em;text-align:right;font-family:var(--iv-font-h);font-size:.6em;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--iv-primary);line-height:1.6}
/* Values live in a narrow column, so long emails must break here — never on the
   card root, or the uppercase labels would break mid-word too. */
${s} .iv-il-v{flex:1 1 auto;min-width:0;font-size:.78em;overflow-wrap:anywhere}

${s} .iv-il-head{border-top:2px solid var(--iv-primary);padding-top:.2em}
${s} .iv-il-head .iv-name{font-size:1.35em;line-height:1.15;display:block}
${s} .iv-il-body{margin-top:.9em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 30%,transparent);padding-top:.2em}

/* Nested blocks arrive with their own spacing tuned for a full-width column. */
${s} .iv-il-v .iv-bio{margin-top:0;font-size:1em}
${s} .iv-il-v .iv-item{padding:.15em 0}
${s} .iv-il-v .iv-item+.iv-item{border-top:none;margin-top:.35em}
${s} .iv-il-v .iv-item-t{font-size:.95em}
${s} .iv-il-v .iv-item-m,${s} .iv-il-v .iv-item-d{font-size:.85em}

@container (max-width:320px){
  ${s} .iv-il-row{display:block}
  ${s} .iv-il-k{text-align:left;margin-bottom:.15em}
}


</style>`;
}

export const indexLedger = { build, styles };
