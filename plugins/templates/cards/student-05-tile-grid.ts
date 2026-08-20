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
import { avatar, esc, nonEmpty } from "../helpers";
import { linesForItems, type PageBlock, type PagedContent } from "../pagination";
import {
  achievementList,
  bio,
  certificationList,
  chips,
  contactRows,
  educationList,
  extracurricularList,
  internshipList,
  projectList,
  publicationList,
} from "../sections";

interface Tile {
  label: string | null;
  body: string;
  weight: number;
}

function tile(label: string | null, body: string, weight: number): Tile | null {
  return body.trim() ? { label, body, weight } : null;
}

/** Every tile, identity first — the single list both render paths consume. */
function tilesFor(p: CardProfile, theme: ResolvedTheme): Tile[] {
  const identity = `<div class="iv-tg-id">${avatar(p, "iv-tg-av", theme.logo?.url)}<div>${
    nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""
  }${nonEmpty(p.designation) ? `<div class="iv-role">${esc(p.designation)}</div>` : ""}</div></div>`;

  /*
   * A tile is half the card wide, so the per-tile caps are NARROW rather than the
   * full SHOW ceiling — eighteen skill chips in a 170px tile is a wall, not a
   * grid. Empty tiles return null and drop out, so the grid always closes evenly.
   */
  return [
    { label: null, body: identity, weight: 3 },
    tile("Skills", chips(p.skills, NARROW.skills), Math.ceil(p.skills.length / 3) + 1),
    tile("Education", educationList(p, NARROW.education), linesForItems(p.education.length)),
    tile("Languages", chips(p.languages, NARROW.languages), Math.ceil(p.languages.length / 4) + 1),
    tile("Projects", projectList(p, NARROW.projects, true), linesForItems(p.projects.length, 3)),
    tile("Internships", internshipList(p, NARROW.internships), linesForItems(p.internships.length)),
    tile("Certifications", certificationList(p, NARROW.certifications), linesForItems(p.certifications.length)),
    tile("Awards", achievementList(p, NARROW.achievements), linesForItems(p.achievements.length)),
    tile("Publications", publicationList(p, NARROW.publications), linesForItems(p.publications.length)),
    tile("Activities", extracurricularList(p, NARROW.extracurriculars), linesForItems(p.extracurriculars.length)),
    tile("Contact", contactRows(p), 3),
    tile("About", bio(p), 3),
  ].filter((t): t is Tile => t !== null);
}

function tileHtml(t: Tile, wide: boolean): string {
  const span = wide ? " iv-tg-wide" : "";
  const heading = t.label ? `<h3 class="iv-sec-h">${esc(t.label)}</h3>` : "";
  return `<section class="iv-tg-tile${span}">${heading}${t.body}</section>`;
}

/**
 * The grid, paginated by ROWS: tiles are paired into two-column grid rows, each
 * an independent block. A lone final tile spans both columns so every row closes.
 * Because each block is its own `.iv-tg-grid`, the grid look survives on
 * continuation pages too (the engine stacks blocks single-column).
 */
function contentBlocks(p: CardProfile, theme: ResolvedTheme): PageBlock[] {
  const tiles = tilesFor(p, theme);
  const out: PageBlock[] = [];
  for (let i = 0; i < tiles.length; i += 2) {
    const a = tiles[i]!;
    const b = tiles[i + 1];
    const cells = b ? tileHtml(a, false) + tileHtml(b, false) : tileHtml(a, true);
    out.push({ html: `<div class="iv-tg-grid">${cells}</div>`, weight: Math.max(a.weight, b?.weight ?? 0) + 1 });
  }
  return out;
}

function build(p: CardProfile, theme: ResolvedTheme): string {
  const rows = contentBlocks(p, theme)
    .map((b) => b.html)
    .join("");
  return `<div class="iv-page">${rows}</div>`;
}

function paged(p: CardProfile, theme: ResolvedTheme): PagedContent {
  return {
    chrome: "",
    slim: nonEmpty(p.fullName) ? esc(p.fullName) : "",
    blocks: contentBlocks(p, theme),
  };
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-tile-grid{background:var(--iv-bg)}
${s} .iv-page{padding:.55em}
${s} .iv-tg-grid{display:grid;grid-template-columns:1fr 1fr;gap:.55em}
/* Each grid row is its own block (for pagination); space them like the gap. */
${s} .iv-tg-grid+.iv-tg-grid{margin-top:.55em}
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


</style>`;
}

export const tileGrid = { build, styles, paged };
