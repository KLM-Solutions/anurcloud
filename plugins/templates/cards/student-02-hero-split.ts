/**
 * Student template 2 — "Hero Split" (DEV-3036)
 *
 *   ┌──────────────────────────────┐
 *   │░░░░░░░░ HERO BAND ░░░░░░░░░░│
 *   │░░░░ Name · Course       ░░░░│
 *   ├───────────────┬──────────────┤
 *   │  Education    │  Skills      │
 *   │               │  Languages   │
 *   ├───────────────┴──────────────┤
 *   │  Projects (full width)       │
 *   └──────────────────────────────┘
 *
 * Structurally: three content bands, not one stack. The name sits ON the hero
 * rather than below it, and the body genuinely splits in two.
 *
 * Thin data: the ugliest failure here is a lopsided split — one column full,
 * one empty. So the split only happens when BOTH columns have content;
 * otherwise the body collapses to a single column.
 * Minimum: name, course, and 2 fillable sections.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { NARROW, SHOW } from "../limits";
import { avatar, esc, logoSlot, nonEmpty } from "../helpers";
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
  socialIcons,
} from "../sections";

function build(p: CardProfile, theme: ResolvedTheme): string {
  const hero = `<header class="iv-hs-hero">
      ${avatar(p, "iv-hs-av")}
      <div class="iv-hs-id">
        ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
        ${nonEmpty(p.designation) ? `<div class="iv-hs-role">${esc(p.designation)}</div>` : ""}
        ${logoSlot(theme.logo)}
      </div>
    </header>`;

  /*
   * NARROW caps on both sides: each column is half the body width, so the full
   * SHOW ceiling would give one column eighteen chips beside the other's two
   * education lines and destroy the balance the split exists for.
   * Awards and activities join the left (things done), publications the right
   * (things written), which keeps the two columns roughly even on a full CV.
   */
  const left = joinBlocks([
    section("Education", () => educationList(p, NARROW.education)),
    section("Internships", () => internshipList(p, NARROW.internships)),
    section("Awards", () => achievementList(p, NARROW.achievements)),
    section("Activities", () => extracurricularList(p, NARROW.extracurriculars)),
  ]);

  const right = joinBlocks([
    section("Skills", () => chips(p.skills, NARROW.skills)),
    section("Publications", () => publicationList(p, NARROW.publications)),
    section("Languages", () => chips(p.languages, NARROW.languages)),
  ]);

  // Both sides must carry content for a split to make sense.
  const isSplit = Boolean(left && right);
  const columns = isSplit
    ? `<div class="iv-hs-col">${left}</div><div class="iv-hs-col">${right}</div>`
    : `<div class="iv-hs-col">${joinBlocks([left, right])}</div>`;

  const body = columns.trim()
    ? `<div class="iv-hs-body${isSplit ? "" : " iv-hs-body-single"}">${columns}</div>`
    : "";

  const full = joinBlocks([
    bio(p, SHOW.bioChars),
    section("Projects", () => projectList(p, SHOW.projects)),
  ]);
  const footerBits = joinBlocks([contactInline(p), socialIcons(p.socialLinks, SHOW.socials)]);

  const tail = joinBlocks([
    full ? `<div class="iv-hs-full">${full}</div>` : "",
    footerBits ? `<div class="iv-hs-foot">${footerBits}</div>` : "",
  ]);

  return `${hero}${body}${tail}`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-hero-split{background:var(--iv-surface)}
${s} .iv-hs-hero{background:var(--iv-grad);color:var(--iv-onp);padding:1.3em 1em 1.1em;display:flex;align-items:center;gap:.8em}
${s} .iv-hs-av{width:3.4em;height:3.4em;box-shadow:0 0 0 2px color-mix(in srgb,var(--iv-onp) 45%,transparent)}
${s} .iv-hs-hero .iv-av-fallback{background:color-mix(in srgb,var(--iv-onp) 18%,transparent);color:var(--iv-onp)}
${s} .iv-hs-id{min-width:0}
${s} .iv-hs-hero .iv-name{color:var(--iv-onp)}
${s} .iv-hs-role{font-size:.78em;color:color-mix(in srgb,var(--iv-onp) 78%,transparent);margin-top:.15em}

${s} .iv-hs-body{display:grid;grid-template-columns:1fr 1fr;gap:0 1em;padding:0 1em}
${s} .iv-hs-body-single{grid-template-columns:1fr}
${s} .iv-hs-col{min-width:0}
${s} .iv-hs-col .iv-sec-h:first-child{margin-top:.9em}

${s} .iv-hs-full{padding:0 1em}
${s} .iv-hs-foot{padding:.9em 1em 1.1em;display:flex;flex-direction:column;gap:.5em}

/* Responsive mode: the split is the first thing to go on a narrow container. */
@container (max-width:340px){${s} .iv-hs-body{grid-template-columns:1fr}}

</style>`;
}

export const heroSplit = { build, styles };
