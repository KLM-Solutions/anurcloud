/**
 * Student template 4 — "Timeline" (DEV-3038)
 *
 *   ┌──────────────────────────────┐
 *   │                     ( ) Name │
 *   │                  Course·Year │
 *   │  o──── 2026  Internship      │
 *   │  o──── 2025  Project         │
 *   │  o──── 2024  Degree          │
 *   │  Skills · Languages          │
 *   └──────────────────────────────┘
 *      ^ time spine down the left
 *
 * Structurally: the only card in the batch organised by TIME rather than by
 * section type. Education, internships, projects and experience are
 * interleaved along one spine instead of living in separate labelled blocks.
 *
 * Dates: this card does no date parsing. `profile.timeline` arrives already
 * merged and sorted by `lib/profile-to-card.ts`, which derives a sort year
 * from free text ("2021–2025" → 2025) and pushes unrecoverable entries to the
 * end in document order. The original text is what gets displayed.
 *
 * Thin data: a timeline with one dot is not a timeline, and no amount of CSS
 * rescues that. The card does not try — the recommender gates it instead.
 * Minimum: 3 entries carrying a recoverable year.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { avatar, esc, nonEmpty } from "../helpers";
import { joinBlocks } from "../guards";
import { chips, contactInline, socialIcons, timelineRows } from "../sections";

function build(p: CardProfile, theme: ResolvedTheme): string {
  const head = `<header class="iv-tl-head">
      <div class="iv-tl-id">
        ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
        ${nonEmpty(p.designation) ? `<div class="iv-role">${esc(p.designation)}</div>` : ""}
      </div>
      ${avatar(p, "iv-tl-av", theme.logo?.url)}
    </header>`;

  const spine = timelineRows(p.timeline, SHOW.timeline);

  const footBits = joinBlocks([
    chips(p.skills, SHOW.skills),
    chips(p.languages, SHOW.languages),
    contactInline(p),
    socialIcons(p.socialLinks, SHOW.socials),
  ]);

  return `<div class="iv-tl-wrap">${head}${
    spine ? `<div class="iv-tl-spine">${spine}</div>` : ""
  }${footBits ? `<footer class="iv-tl-foot">${footBits}</footer>` : ""}</div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-timeline{background:var(--iv-surface)}
${s} .iv-tl-wrap{padding:1.2em 1.1em 1.1em}

/* Identity sits top-RIGHT, off the spine — the spine owns the left edge. */
${s} .iv-tl-head{display:flex;align-items:center;justify-content:flex-end;gap:.7em;text-align:right;padding-bottom:1.1em;border-bottom:1px solid color-mix(in srgb,var(--iv-muted) 20%,transparent)}
${s} .iv-tl-id{min-width:0}
${s} .iv-tl-av{width:3.1em;height:3.1em;order:2}

${s} .iv-tl-spine{padding-top:1.1em}
${s} .iv-tl-spine .iv-tl-row:last-child{padding-bottom:0}
${s} .iv-tl-spine .iv-item-t{margin-top:.05em}

${s} .iv-tl-foot{margin-top:.4em;padding-top:.8em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 20%,transparent);display:flex;flex-direction:column;gap:.45em}


</style>`;
}

export const timelineCard = { build, styles };
