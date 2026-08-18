/**
 * Student template 7 — "Corner Wedge" (DEV-3042)
 *
 *   ┌──────────────────────┐
 *   │░░░░░░░░░░░╲          │
 *   │░ ( )       ╲  Skills │
 *   │░ Name       ╲ Lang   │
 *   │░ Course      ╲       │
 *   ├───────────────╲──────┤
 *   │  Education             │
 *   │  Projects              │
 *   └──────────────────────┘
 *        ^ diagonal colour wedge, top-left
 *
 * Structurally: the only card in the set whose colour region is not a rectangle.
 * A `clip-path` wedge cuts across the top-left corner, identity sits inside it,
 * and a short secondary column tucks into the space the diagonal opens up on the
 * right. Every other layout is built from straight bands and columns.
 *
 * ── Why the wedge is a background layer, not a container ───────────────────
 * Text inside a clipped element gets clipped too, so the wedge is an absolutely
 * positioned sibling behind the content. The identity block is then padded to
 * sit within the safe area of the diagonal. That also means a long name wraps
 * instead of being sliced by the clip edge.
 *
 * Thin data: with no skills or languages the right column disappears and the
 * identity simply occupies the full wedge — no gap opens, because the wedge is
 * painted, not laid out.
 * Minimum: name + 1 fillable section.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { NARROW, SHOW } from "../limits";
import { avatar, esc, nonEmpty } from "../helpers";
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
  // Skills only, and on the NARROW cap. The wedge is at its thinnest on the right,
  // so this column has the least vertical room on the card — a second section here
  // pushed "Languages" onto the diagonal, half on colour and half off it, and a
  // long chip list would run under the wedge itself.
  const aside = joinBlocks([
    section("Skills", () => chips(p.skills, NARROW.skills), "iv-sec-h iv-cw-h"),
  ]);

  const contact = contactInline(p);

  const head = `<header class="iv-cw-head">
      <div class="iv-cw-id">
        ${avatar(p, "iv-cw-av", theme.logo?.url)}
        ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
        ${nonEmpty(p.designation) ? `<div class="iv-role">${esc(p.designation)}</div>` : ""}
        ${contact ? `<div class="iv-cinline">${contact}</div>` : ""}
      </div>
      ${aside ? `<aside class="iv-cw-aside">${aside}</aside>` : ""}
    </header>`;

  const body = joinBlocks([
    section("Education", () => educationList(p, SHOW.education)),
    section("Projects", () => projectList(p, SHOW.projects)),
    section("Internships", () => internshipList(p, SHOW.internships)),
    section("Awards", () => achievementList(p, SHOW.achievements)),
    section("Publications", () => publicationList(p, SHOW.publications)),
    section("Activities", () => extracurricularList(p, SHOW.extracurriculars)),
    section("Languages", () => chips(p.languages, SHOW.languages)),
    section("About", () => bio(p, SHOW.bioChars)),
  ]);

  return `<div class="iv-cw-wrap">${head}<main class="iv-cw-body">${body}</main></div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-corner-wedge{background:var(--iv-surface)}
${s} .iv-cw-wrap{position:relative}

/* The wedge is the header's own background layer, sized BY the header.
   It was a fixed-height sibling first, and that is a bug rather than a detail:
   on a thin profile the header shrinks, the body slides up under the wedge, and
   dark body text lands on the dark diagonal — unreadable. Tying the clip to the
   header means it can never outgrow the content it belongs to.
   The diagonal lives entirely inside the bottom padding, so no text on either
   column is ever crossed by it. */
${s} .iv-cw-head{position:relative;isolation:isolate;display:flex;gap:.7em;padding:1.15em 1.1em 2.5em;color:var(--iv-onp)}
${s} .iv-cw-head::before{content:"";position:absolute;inset:0;background:var(--iv-grad);clip-path:polygon(0 0,100% 0,100% calc(100% - 2.1em),0 100%);z-index:-1}
${s} .iv-cw-id{min-width:0;flex:1 1 auto}
${s} .iv-cw-av{width:3.1em;height:3.1em;margin-bottom:.45em;box-shadow:0 0 0 2px color-mix(in srgb,var(--iv-onp) 40%,transparent)}
${s} .iv-cw-head .iv-av-fallback{background:color-mix(in srgb,var(--iv-onp) 18%,transparent);color:var(--iv-onp)}
${s} .iv-cw-head .iv-name{color:var(--iv-onp);font-size:1.15em}
${s} .iv-cw-head .iv-role,${s} .iv-cw-head .iv-cinline{color:color-mix(in srgb,var(--iv-onp) 80%,transparent)}
${s} .iv-cw-head .iv-cinline{font-size:.65em;margin-top:.2em}

/* The aside sits in the space the diagonal opens up on the right, so it is
   top-aligned and narrow — the wedge is thinnest at its own bottom-left. */
${s} .iv-cw-aside{flex:0 0 42%;max-width:42%;min-width:0}
${s} .iv-cw-h{color:color-mix(in srgb,var(--iv-onp) 75%,transparent);margin-top:0}
${s} .iv-cw-aside .iv-sec-h+*{margin-bottom:.5em}
${s} .iv-cw-aside .iv-chip{background:color-mix(in srgb,var(--iv-onp) 20%,transparent);color:var(--iv-onp)}

${s} .iv-cw-body{padding:.5em 1.1em 1.15em}
@container (max-width:320px){${s} .iv-cw-aside{display:none}}


</style>`;
}

export const cornerWedge = { build, styles };
