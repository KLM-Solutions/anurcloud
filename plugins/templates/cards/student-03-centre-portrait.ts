/**
 * Student template 3 — "Centre Portrait" (DEV-3037)
 *
 *   ┌──────────────────────────────┐
 *   │            (  )              │
 *   │            Name              │
 *   │        Course · Year         │
 *   │   ────────────────────────   │
 *   │            About             │
 *   │   ────────────────────────   │
 *   │          Education           │
 *   └──────────────────────────────┘
 *        no colour block anywhere
 *
 * Structurally: hierarchy comes from typography, centring and whitespace —
 * not from a coloured band. Colour survives only as accents (rules, links,
 * the initials ring), so the theme still visibly takes effect.
 *
 * Thin data: this is the strongest card in the set when there is almost
 * nothing to show — a portrait, a name and white space reads as a deliberate
 * minimal card rather than a failure. The recommender should favour it there.
 * Minimum: name only.
 *
 * ── Completeness + pagination (20 Aug 2026) ─────────────────────────────────
 * Every field is shown, uncapped (owner decision). `contentBlocks()` is the ONE
 * ordered list of sections; both `build()` (single page) and `paged()` (flows
 * across pages) consume it, so the two paths cannot drift. The centred hairline
 * between sections is now a CSS rule on adjacent `.iv-cp-sec`, so it never
 * strands at a page break.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { avatar, esc, nonEmpty } from "../helpers";
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
  socialIcons,
} from "../sections";

/** Wrap a rendered section so adjacent ones get the centred hairline via CSS. */
function sec(html: string): string {
  return html.trim() ? `<div class="iv-cp-sec">${html}</div>` : "";
}

/**
 * Every content section, in order — the single source both render paths use.
 * Each block carries an estimated weight in "lines" for pagination.
 */
function contentBlocks(p: CardProfile): PageBlock[] {
  const out: PageBlock[] = [];
  const add = (html: string, weight: number) => {
    const wrapped = sec(html);
    if (wrapped) out.push({ html: wrapped, weight });
  };
  add(bio(p, SHOW.bioChars), linesForText(p.bio));
  add(section("Education", () => educationList(p, SHOW.education)), linesForItems(p.education.length));
  add(section("Projects", () => projectList(p, SHOW.projects)), linesForItems(p.projects.length, 3));
  add(section("Internships", () => internshipList(p, SHOW.internships)), linesForItems(p.internships.length));
  add(section("Certifications", () => certificationList(p, SHOW.certifications)), linesForItems(p.certifications.length));
  add(section("Skills", () => chips(p.skills, SHOW.skills)), Math.ceil(p.skills.length / 3) + 1);
  add(section("Languages", () => chips(p.languages, SHOW.languages)), Math.ceil(p.languages.length / 4) + 1);
  add(section("Awards", () => achievementList(p, SHOW.achievements)), linesForItems(p.achievements.length));
  add(section("Publications", () => publicationList(p, SHOW.publications)), linesForItems(p.publications.length));
  add(section("Activities", () => extracurricularList(p, SHOW.extracurriculars)), linesForItems(p.extracurriculars.length));
  add(joinBlocks([contactInline(p), socialIcons(p.socialLinks, SHOW.socials)]), 2);
  return out;
}

function head(p: CardProfile, theme: ResolvedTheme): string {
  return `<header class="iv-cp-head">
      ${avatar(p, "iv-cp-av", theme.logo?.url)}
      ${nonEmpty(p.fullName) ? `<h2 class="iv-cp-name">${esc(p.fullName)}</h2>` : ""}
      ${nonEmpty(p.designation) ? `<div class="iv-cp-role">${esc(p.designation)}</div>` : ""}
    </header>`;
}

function build(p: CardProfile, theme: ResolvedTheme): string {
  const body = contentBlocks(p)
    .map((b) => b.html)
    .join("");
  return `<div class="iv-page">${head(p, theme)}${body}</div>`;
}

function paged(p: CardProfile, theme: ResolvedTheme): PagedContent {
  return {
    chrome: head(p, theme),
    slim: nonEmpty(p.fullName) ? esc(p.fullName) : "",
    blocks: contentBlocks(p),
    chromeWeight: 6, // avatar + name + role
  };
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-centre-portrait{background:var(--iv-surface)}
${s} .iv-page{padding:1.9em 1.5em 1.6em;text-align:center}
${s} .iv-cp-head{display:flex;flex-direction:column;align-items:center;gap:.5em}
${s} .iv-cp-av{width:4.6em;height:4.6em}

/* No colour block: the initials fallback is an outlined ring, not a filled disc. */
${s} .iv-cp-head .iv-av-fallback{background:transparent;color:var(--iv-primary);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--iv-primary) 40%,transparent)}

${s} .iv-cp-name{font-family:var(--iv-font-h);font-weight:700;font-size:1.35em;line-height:1.15;letter-spacing:-.015em}
${s} .iv-cp-role{font-size:.78em;color:var(--iv-muted);letter-spacing:.06em;text-transform:uppercase}

/* Sections: the first sits below the header; each later one gets a centred hairline. */
${s} .iv-cp-head+.iv-cp-sec{margin-top:1.2em}
${s} .iv-cp-sec+.iv-cp-sec{margin-top:1.1em;padding-top:1.1em;position:relative}
${s} .iv-cp-sec+.iv-cp-sec::before{content:"";position:absolute;top:0;left:20%;width:60%;height:1px;background:color-mix(in srgb,var(--iv-primary) 22%,transparent)}
/* On a continuation page the first section leads the page — no stranded rule. */
${s} .iv-page-cont .iv-cp-sec:first-child{margin-top:0;padding-top:0}
${s} .iv-page-cont .iv-cp-sec:first-child::before{display:none}

${s} .iv-cp-sec .iv-sec-h{margin-top:0;margin-bottom:.5em;letter-spacing:.14em}
${s} .iv-cp-sec .iv-bio{margin-top:0;font-size:.82em}
${s} .iv-cp-sec .iv-chips{justify-content:center}
${s} .iv-cp-sec .iv-socials{justify-content:center;margin-top:.5em}

/* Centred layout: list items lose their dividing lines, spacing carries them. */
${s} .iv-cp-sec .iv-item+.iv-item{border-top:none;margin-top:.5em}
${s} .iv-cp-sec .iv-chip{background:transparent;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--iv-primary) 30%,transparent)}
</style>`;
}

export const centrePortrait = { build, styles, paged };
