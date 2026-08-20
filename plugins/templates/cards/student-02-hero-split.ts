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
 *
 * ── Pagination (20 Aug 2026) ────────────────────────────────────────────────
 * MULTI-ZONE card (hero band + two-column body + full-width tail), so it renders
 * page 1 itself via `firstPage` — the hero and the split survive intact — and
 * only the overflow sections flow to single-column continuation pages. Every
 * section is a `PageBlock` tagged with the zone it belongs to; `blocks()` is the
 * one ordered list both `build()` and `paged()` consume, so the two cannot drift.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { NARROW, SHOW } from "../limits";
import { avatar, esc, nonEmpty } from "../helpers";
import { joinBlocks, section } from "../guards";
import { linesForItems, linesForText, type PageBlock } from "../pagination";
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
  socialIcons,
} from "../sections";

type Zone = "left" | "right" | "full" | "foot";
interface ZonedBlock extends PageBlock {
  zone: Zone;
}

function hero(p: CardProfile, theme: ResolvedTheme): string {
  return `<header class="iv-hs-hero">
      ${avatar(p, "iv-hs-av", theme.logo?.url)}
      <div class="iv-hs-id">
        ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
        ${nonEmpty(p.designation) ? `<div class="iv-hs-role">${esc(p.designation)}</div>` : ""}
      </div>
    </header>`;
}

/*
 * Every content section, tagged with the zone it renders in — the single source
 * both render paths use. Order is the reading order for continuation pages.
 *
 * NARROW caps on both split columns: each is half the body width, so the full
 * SHOW ceiling would give one column eighteen chips beside the other's two
 * education lines and destroy the balance the split exists for. Awards and
 * activities join the left (things done), publications the right (things
 * written), which keeps the two columns roughly even on a full CV.
 */
function zones(p: CardProfile): ZonedBlock[] {
  const out: ZonedBlock[] = [];
  const add = (html: string, weight: number, zone: Zone) => {
    if (html.trim()) out.push({ html, weight, zone });
  };
  add(section("Education", () => educationList(p, NARROW.education)), linesForItems(p.education.length), "left");
  add(section("Certifications", () => certificationList(p, SHOW.certifications)), linesForItems(p.certifications.length), "left");
  add(section("Internships", () => internshipList(p, NARROW.internships)), linesForItems(p.internships.length), "left");
  add(section("Awards", () => achievementList(p, NARROW.achievements)), linesForItems(p.achievements.length), "left");
  add(section("Activities", () => extracurricularList(p, NARROW.extracurriculars)), linesForItems(p.extracurriculars.length), "left");
  add(section("Skills", () => chips(p.skills, NARROW.skills)), Math.ceil(p.skills.length / 3) + 1, "right");
  add(section("Publications", () => publicationList(p, NARROW.publications)), linesForItems(p.publications.length), "right");
  add(section("Languages", () => chips(p.languages, NARROW.languages)), Math.ceil(p.languages.length / 4) + 1, "right");
  add(bio(p, SHOW.bioChars), linesForText(p.bio), "full");
  add(section("Projects", () => projectList(p, SHOW.projects)), linesForItems(p.projects.length, 3), "full");
  add(joinBlocks([contactInline(p), socialIcons(p.socialLinks, SHOW.socials)]), 2, "foot");
  return out;
}

/** The ordered content blocks for the pagination engine (zone dropped). */
function blocks(p: CardProfile): PageBlock[] {
  return zones(p).map(({ html, weight }) => ({ html, weight }));
}

/** Page 1: hero band, the two-column split, and the full-width tail — using only
 *  the blocks that fit. Reproduces the card's designed layout exactly. */
function firstPage(p: CardProfile, theme: ResolvedTheme, fit: PageBlock[]): string {
  const inFit = new Set(fit.map((b) => b.html));
  const all = zones(p);
  const pick = (zone: Zone) =>
    joinBlocks(all.filter((z) => z.zone === zone && inFit.has(z.html)).map((z) => z.html));

  const left = pick("left");
  const right = pick("right");
  // Both sides must carry content for a split to make sense.
  const isSplit = Boolean(left && right);
  const columns = isSplit
    ? `<div class="iv-hs-col">${left}</div><div class="iv-hs-col">${right}</div>`
    : `<div class="iv-hs-col">${joinBlocks([left, right])}</div>`;
  const body = columns.trim()
    ? `<div class="iv-hs-body${isSplit ? "" : " iv-hs-body-single"}">${columns}</div>`
    : "";

  const full = pick("full");
  const foot = pick("foot");
  const tail = joinBlocks([
    full ? `<div class="iv-hs-full">${full}</div>` : "",
    foot ? `<div class="iv-hs-foot">${foot}</div>` : "",
  ]);

  return `${hero(p, theme)}${body}${tail}`;
}

function build(p: CardProfile, theme: ResolvedTheme): string {
  // Single-page fallback: the whole layout with every block placed.
  return firstPage(p, theme, blocks(p));
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

/* Continuation pages (2+) are a single-column stack of overflow sections, with
   no hero band or split — so they carry the body padding the zone wrappers gave
   on page 1. */
${s} .iv-page-cont{padding:1.1em 1em}
${s} .iv-page-cont .iv-sec-h:first-of-type{margin-top:0}
</style>`;
}

export const heroSplit = { build, styles };
