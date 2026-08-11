/**
 * Student template 5 — "Tile Grid" (DEV-3039)
 *
 *   ┌───────────────┬──────────────┐
 *   │  ( )  Name    │   Skills     │
 *   ├───────┬───────┼──────────────┤
 *   │  Edu  │ Lang  │   Projects   │
 *   ├───────┴───────┤              │
 *   │   Contact     │              │
 *   └───────────────┴──────────────┘
 *          equal-weight tiles
 *
 * Structurally: no single reading order. Identity is one tile among peers
 * rather than a header band — no other card in the set demotes it that way.
 *
 * ── Reflow ────────────────────────────────────────────────────────────────
 * A grid punishes missing data harder than any stacked layout: in a stack a
 * missing section vanishes, in a grid it leaves a hole. The rule, settled
 * before building rather than discovered during it:
 *
 *     two columns; if the tile count is ODD, the LAST tile spans both.
 *
 * That closes the row at every count — 4, 5, 6, 7 — so a hole is impossible
 * by construction rather than by patching cases. This is also the pattern any
 * future grid template in the professional set should follow.
 *
 * Thin data: two lonely tiles is not a grid, and the card does not pretend
 * otherwise. Minimum: 4 fillable tiles; the recommender gates below that.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { NARROW } from "../limits";
import { avatar, esc, logoSlot, nonEmpty } from "../helpers";
import {
  achievementList,
  bio,
  chips,
  contactRows,
  educationList,
  extracurricularList,
  projectList,
  publicationList,
} from "../sections";

interface Tile {
  label: string | null;
  body: string;
}

function tile(label: string | null, body: string): Tile | null {
  return body.trim() ? { label, body } : null;
}

function build(p: CardProfile, theme: ResolvedTheme): string {
  const identity = `<div class="iv-tg-id">${avatar(p, "iv-tg-av")}<div>${
    nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""
  }${nonEmpty(p.designation) ? `<div class="iv-role">${esc(p.designation)}</div>` : ""}${logoSlot(theme.logo)}</div></div>`;

  /*
   * A tile is half the card wide, so the per-tile caps are NARROW rather than the
   * full SHOW ceiling — eighteen skill chips in a 170px tile is a wall, not a
   * grid. The three added families each get their own tile; empty ones return
   * null and the row-closing logic below adjusts, so a profile with awards and one
   * without both produce a grid that closes evenly.
   */
  const tiles: Tile[] = [
    // Identity is a tile, not a banner — always first, never dominant.
    { label: null, body: identity },
    tile("Skills", chips(p.skills, NARROW.skills)),
    tile("Education", educationList(p, NARROW.education)),
    tile("Languages", chips(p.languages, NARROW.languages)),
    tile("Projects", projectList(p, NARROW.projects, false)),
    tile("Awards", achievementList(p, NARROW.achievements)),
    tile("Publications", publicationList(p, NARROW.publications)),
    tile("Activities", extracurricularList(p, NARROW.extracurriculars)),
    tile("Contact", contactRows(p)),
    tile("About", bio(p, 150)),
  ].filter((t): t is Tile => t !== null);

  // Odd count → the last tile spans both columns and the row closes.
  const lastSpans = tiles.length % 2 === 1;

  const cells = tiles
    .map((t, i) => {
      const span = lastSpans && i === tiles.length - 1 ? " iv-tg-wide" : "";
      const heading = t.label ? `<h3 class="iv-sec-h">${esc(t.label)}</h3>` : "";
      return `<section class="iv-tg-tile${span}">${heading}${t.body}</section>`;
    })
    .join("");

  return `<div class="iv-tg-grid">${cells}</div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-tile-grid{background:var(--iv-bg);padding:.55em}
${s} .iv-tg-grid{display:grid;grid-template-columns:1fr 1fr;gap:.55em}
${s} .iv-tg-wide{grid-column:1 / -1}

${s} .iv-tg-tile{background:var(--iv-surface);border-radius:calc(var(--iv-radius) * .5);padding:.75em .8em;min-width:0;overflow:hidden}
${s} .iv-tg-tile .iv-sec-h{margin-top:0;margin-bottom:.4em}

/* The identity tile is styled as a peer, not a header — same box, same weight. */
${s} .iv-tg-id{display:flex;align-items:center;gap:.6em;min-width:0}
${s} .iv-tg-av{width:2.6em;height:2.6em}
${s} .iv-tg-tile .iv-name{font-size:1.02em}
${s} .iv-tg-tile .iv-role{font-size:.72em}
${s} .iv-tg-tile .iv-bio{margin-top:0;font-size:.75em}

/* Contact rows are cramped in a tile — labels stack above their values. */
${s} .iv-tg-tile .iv-crow{display:block;padding:.12em 0}
${s} .iv-tg-tile .iv-clabel{display:block;flex:none;font-size:.62em}
${s} .iv-tg-tile .iv-cval{font-size:.95em}

@container (max-width:330px){${s} .iv-tg-grid{grid-template-columns:1fr}${s} .iv-tg-wide{grid-column:auto}}


/* The logo's dedicated row on this card. */
${s} .iv-tg-id .iv-logo-slot{max-width:32%}
</style>`;
}

export const tileGrid = { build, styles };
