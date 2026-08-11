/**
 * Student template 8 — "Monogram Block" (DEV-3043)
 *
 *   ┌────────┬─────────────────┐
 *   │▓▓▓▓▓▓▓▓│ KARTHICK R      │
 *   │▓  KR  ▓│ BTech IT        │
 *   │▓▓▓▓▓▓▓▓│ mail · phone    │
 *   ├────────┴─────────────────┤
 *   │  EDUCATION               │
 *   │  PROJECTS                │
 *   │  SKILLS                  │
 *   └──────────────────────────┘
 *      ^ SQUARE block, part-width
 *
 * ── Why this layout exists ─────────────────────────────────────────────────
 * Mithra Murugesan (Anur Cloud), 3 Aug 2026, on our first prototypes:
 *
 *   "the overall layout, vertical stack, banner on top, circular initials
 *    avatar, white body below, stays the same … we'd end up with a smaller set
 *    of real layout options than the count suggests."
 *
 * This card is built to break that list, not decorate it:
 *   - the colour region is a SQUARE occupying part of the width, not a banner
 *     spanning it
 *   - the monogram is set as oversized type in that square — there is no circle
 *     anywhere on the card
 *   - the identity sits BESIDE the colour, on white, rather than on top of it
 *
 * A photo, when one exists, is square-cropped to match the block. That is the
 * one place this card overrides the shared circular avatar primitive, and it is
 * deliberate: a round photo would put the flagged pattern straight back.
 *
 * Thin data: the block and the name are the card. With no sections it reads as a
 * monogram plate, which is a legitimate minimal card rather than a broken one.
 * Minimum: name only.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { attr, esc, initials, logoSlot, nonEmpty, safeUrl } from "../helpers";
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

/**
 * Square monogram, or a square-cropped photo. Not the shared `avatar()` helper —
 * that one is a circle by definition, which is the thing being avoided here.
 */
function monogram(p: CardProfile): string {
  const src = safeUrl(p.photoUrl, { allowDataImage: true });
  if (src) {
    return `<div class="iv-mb-block"><img src="${attr(src)}" alt="${attr(
      p.fullName ?? "photo",
    )}" /></div>`;
  }
  return `<div class="iv-mb-block"><span class="iv-mb-mono">${esc(
    initials(p.fullName),
  )}</span></div>`;
}

function build(p: CardProfile, theme: ResolvedTheme): string {
  const contact = contactInline(p);
  const socials = socialIcons(p.socialLinks, SHOW.socials);

  const head = `<header class="iv-mb-head">
      ${monogram(p)}
      <div class="iv-mb-who">
        ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
        ${nonEmpty(p.designation) ? `<div class="iv-role">${esc(p.designation)}</div>` : ""}
        ${contact ? `<div class="iv-cinline">${contact}</div>` : ""}
        ${socials ? `<div class="iv-mb-social">${socials}</div>` : ""}
        ${logoSlot(theme.logo)}
      </div>
    </header>`;

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

  return `<div class="iv-mb-wrap">${head}${
    body ? `<main class="iv-mb-body">${body}</main>` : ""
  }</div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-monogram-block{background:var(--iv-surface)}
${s} .iv-mb-wrap{display:flex;flex-direction:column;min-height:100%}

/* Identity sits BESIDE the colour, on the white surface — not on a band. */
${s} .iv-mb-head{display:flex;align-items:stretch;gap:.85em;padding:1.05em 1.05em .3em}
${s} .iv-mb-who{min-width:0;flex:1 1 auto;align-self:center}
${s} .iv-mb-head .iv-name{font-size:1.2em;text-transform:uppercase;letter-spacing:.01em}
${s} .iv-mb-head .iv-cinline{margin-top:.3em}
${s} .iv-mb-social{margin-top:.4em}

/* A square, part-width block — deliberately not a full-width banner, and
   deliberately not round. aspect-ratio keeps it square at every card size. */
${s} .iv-mb-block{flex:0 0 auto;width:4.6em;aspect-ratio:1;background:var(--iv-grad);border-radius:calc(var(--iv-radius) * .28);display:flex;align-items:center;justify-content:center;overflow:hidden}
${s} .iv-mb-block img{width:100%;height:100%;object-fit:cover}
/* The monogram is typography, not an avatar — hence the size and the tracking. */
${s} .iv-mb-mono{font-family:var(--iv-font-h);font-weight:700;font-size:1.7em;line-height:1;letter-spacing:.03em;color:var(--iv-onp)}

${s} .iv-mb-body{flex:1 1 auto;padding:.55em 1.05em 1.1em}
${s} .iv-mb-body .iv-sec-h:first-child{margin-top:.5em}
${s} .iv-mb-body .iv-bio{margin-top:0}

/* At the narrowest sizes the square would crowd a long name off the card. */
@container (max-width:310px){
  ${s} .iv-mb-head{align-items:center}
  ${s} .iv-mb-block{width:3.6em}
  ${s} .iv-mb-mono{font-size:1.3em}
}

</style>`;
}

export const monogramBlock = { build, styles };
