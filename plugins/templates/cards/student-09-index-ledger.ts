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
import { linesForItems, linesForText, type PageBlock, type PagedContent } from "../pagination";
import {
  achievementList,
  bio,
  certificationList,
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

/** The identity rows — the card's fixed head, always on page 1. */
function head(p: CardProfile): string {
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
  return `<div class="iv-il-head">${identity}</div>`;
}

/** The detail rows, in order — one list both render paths consume. */
function contentBlocks(p: CardProfile): PageBlock[] {
  const out: PageBlock[] = [];
  const add = (label: string, value: string, weight: number) => {
    const html = row(label, value);
    if (html) out.push({ html, weight });
  };
  add("About", bio(p, SHOW.bioChars), linesForText(p.bio));
  add("Education", educationList(p, SHOW.education), linesForItems(p.education.length));
  add("Certifications", certificationList(p, SHOW.certifications), linesForItems(p.certifications.length));
  add("Projects", projectList(p, SHOW.projects), linesForItems(p.projects.length, 3));
  add("Internships", internshipList(p, SHOW.internships), linesForItems(p.internships.length));
  add("Awards", achievementList(p, SHOW.achievements), linesForItems(p.achievements.length));
  add("Papers", publicationList(p, SHOW.publications), linesForItems(p.publications.length));
  add("Activities", extracurricularList(p, SHOW.extracurriculars), linesForItems(p.extracurriculars.length));
  add("Skills", chips(p.skills, SHOW.skills), Math.ceil(p.skills.length / 3) + 1);
  add("Languages", chips(p.languages, SHOW.languages), Math.ceil(p.languages.length / 4) + 1);
  return out;
}

function build(p: CardProfile): string {
  const detail = contentBlocks(p)
    .map((b) => b.html)
    .join("");
  return `<div class="iv-page">${head(p)}${detail}</div>`;
}

function paged(p: CardProfile): PagedContent {
  return {
    chrome: head(p),
    slim: nonEmpty(p.fullName) ? esc(p.fullName) : "",
    blocks: contentBlocks(p),
    chromeWeight: 4, // name + course + contact rows
  };
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
/* No colour block anywhere — hierarchy comes from alignment and rule weight.
   The primary colour appears only in the label gutter and the top rule. */
${s}.iv-index-ledger{background:var(--iv-surface)}
${s} .iv-page{padding:1.15em 1.05em}

${s} .iv-il-row{display:flex;gap:.75em;align-items:baseline;padding:.4em 0}
${s} .iv-il-row+.iv-il-row{border-top:1px solid color-mix(in srgb,var(--iv-muted) 15%,transparent)}

/* Fixed, right-aligned gutter — flexing it would break the ledger alignment
   that is the entire identity of this layout. Wide enough (and with tight enough
   spacing) that the common labels — CONTACT, EDUCATION, PROJECTS, LANGUAGES —
   sit on ONE line. overflow-wrap:break-word overrides the card's inherited
   "anywhere" so a label breaks only when it genuinely cannot fit (the long ones
   like CERTIFICATIONS), never mid-word on a label that fits.
   (No backticks in this block — it is inside a template literal.) */
${s} .iv-il-k{flex:0 0 7.4em;text-align:right;font-family:var(--iv-font-h);font-size:.6em;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--iv-primary);line-height:1.5;overflow-wrap:break-word}
/* Values live in a narrow column, so long emails must break here — never on the
   card root, or the uppercase labels would break mid-word too. */
${s} .iv-il-v{flex:1 1 auto;min-width:0;font-size:.78em;overflow-wrap:anywhere}

${s} .iv-il-head{border-top:2px solid var(--iv-primary);padding-top:.2em}
${s} .iv-il-head .iv-name{font-size:1.35em;line-height:1.15;display:block}
/* Head → first detail row separator (was the .iv-il-body wrapper before
   pagination made rows direct children of the page). */
${s} .iv-il-head+.iv-il-row{margin-top:.9em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 30%,transparent);padding-top:.6em}

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

export const indexLedger = { build, styles, paged };
