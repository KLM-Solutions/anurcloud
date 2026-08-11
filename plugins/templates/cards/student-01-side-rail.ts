/**
 * Student template 1 — "Side Rail" (DEV-3035)
 *
 *   ┌───────┬──────────────────────┐
 *   │░░░░░░░│  Name                │
 *   │  ( )  │  Course · Year       │
 *   │░░░░░░░│  About               │
 *   │  mail │  ──────────────────  │
 *   │  phone│  Education           │
 *   │  loc  │  Projects            │
 *   │  Lang │  Skills              │
 *   └───────┴──────────────────────┘
 *       ^ coloured rail, full height
 *
 * Structurally: two columns, read left-to-right. No top banner at all, and
 * contact lives in the rail rather than the body — the point of the batch is
 * that the skeletons differ, not the paint (client feedback, 3 Aug 2026).
 *
 * Thin data: with no contact and no languages the rail would be an empty
 * column, so it collapses to a plain colour band carrying just the avatar.
 * Minimum: name only — the most forgiving layout in the set.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { avatar, logoSlot } from "../helpers";
import { section, joinBlocks } from "../guards";
import {
  achievementList,
  bio,
  chips,
  contactRows,
  educationList,
  extracurricularList,
  internshipList,
  nameBlock,
  projectList,
  publicationList,
  socialIcons,
} from "../sections";

function build(p: CardProfile, theme: ResolvedTheme): string {
  const contact = contactRows(p);
  const languages = chips(p.languages, SHOW.languages);
  const socials = socialIcons(p.socialLinks, SHOW.socials);

  // An empty rail is the one way this layout looks broken — detect it and
  // switch to a bare band instead of rendering a blank column.
  const railHasContent = Boolean(contact || languages || socials);

  const rail = `<aside class="iv-sr-rail${railHasContent ? "" : " iv-sr-rail-bare"}">
      ${avatar(p, "iv-sr-av")}
      ${contact ? `<div class="iv-sr-block">${contact}</div>` : ""}
      ${languages ? `<div class="iv-sr-block">${languages}</div>` : ""}
      ${socials ? `<div class="iv-sr-block">${socials}</div>` : ""}
    </aside>`;

  const body = joinBlocks([
    nameBlock(p) + logoSlot(theme.logo),
    bio(p, SHOW.bioChars),
    section("Education", () => educationList(p, SHOW.education)),
    section("Projects", () => projectList(p, SHOW.projects)),
    section("Internships", () => internshipList(p, SHOW.internships)),
    section("Skills", () => chips(p.skills, SHOW.skills)),
    section("Awards", () => achievementList(p, SHOW.achievements)),
    section("Publications", () => publicationList(p, SHOW.publications)),
    section("Activities", () => extracurricularList(p, SHOW.extracurriculars)),
  ]);

  return `<div class="iv-sr-wrap">${rail}<main class="iv-sr-main">${body}</main></div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-side-rail{background:var(--iv-surface)}
${s} .iv-sr-wrap{display:flex;align-items:stretch;min-height:100%}
/* 38%, not 33%: at the default 380px card a narrower rail cannot fit an email
   on one line, and it breaks mid-word ("karthik@example.c om"). */
${s} .iv-sr-rail{flex:0 0 38%;max-width:38%;background:var(--iv-grad);color:var(--iv-onp);padding:1.1em .6em;display:flex;flex-direction:column;align-items:center;gap:.7em;text-align:center}
${s} .iv-sr-rail-bare{justify-content:center}
${s} .iv-sr-av{width:3.6em;height:3.6em;box-shadow:0 0 0 2px color-mix(in srgb,var(--iv-onp) 45%,transparent)}
${s} .iv-sr-rail .iv-av-fallback{background:color-mix(in srgb,var(--iv-onp) 18%,transparent);color:var(--iv-onp)}
${s} .iv-sr-block{width:100%}

/* Contact rows sit on the coloured rail here, so they stack and invert. */
${s} .iv-sr-rail .iv-crow{display:block;text-align:center;padding:.18em 0}
${s} .iv-sr-rail .iv-clabel{display:block;flex:none;color:color-mix(in srgb,var(--iv-onp) 70%,transparent);font-size:.68em}
/* Emails are the longest thing the rail ever carries — size for them, and let
   a genuinely oversized address break rather than overflow the card. */
${s} .iv-sr-rail .iv-cval{display:block;color:var(--iv-onp);font-size:.82em;line-height:1.3;overflow-wrap:anywhere}
${s} .iv-sr-rail .iv-chips{justify-content:center}
${s} .iv-sr-rail .iv-chip{background:color-mix(in srgb,var(--iv-onp) 20%,transparent);color:var(--iv-onp)}
${s} .iv-sr-rail .iv-socials{justify-content:center}

${s} .iv-sr-main{flex:1 1 auto;min-width:0;padding:1.1em 1em;background:var(--iv-surface)}
${s} .iv-sr-main .iv-sec-h:first-child{margin-top:0}
${s} .iv-sr-main .iv-name{margin-top:.1em}

${s}:has(.iv-logo-r) .iv-sr-main{padding-top:2.3em}

/* The logo's dedicated row on this card. */
${s} .iv-sr-rail .iv-logo-slot{align-self:center;margin:0 0 .2em}
</style>`;
}

export const sideRail = { build, styles };
