/**
 * Student template 6 — "Footer Anchor" (DEV-3041)
 *
 *   ┌──────────────────────┐
 *   │  EDUCATION           │
 *   │  Projects            │
 *   │  Skills              │
 *   │  ──────────────────  │
 *   │░░░░░░░░░░░░░░░░░░░░░░│
 *   │░ ( )  Name          ░│
 *   │░      Course · mail ░│
 *   └──────────────────────┘
 *        ^ colour band at the BOTTOM
 *
 * Structurally: the inverse of Hero Split. Content is read first and the
 * identity closes the card, the way a signature closes a letter. Nothing else
 * in the set puts the colour block at the bottom, so the silhouette alone tells
 * it apart in grayscale.
 *
 * The anchor is `margin-top:auto`, not a fixed offset — with three sections or
 * with six, it stays welded to the bottom edge and the content grows above it.
 *
 * Thin data: the anchor carries name, course and contact, so it is never empty
 * while a name exists; a card with only a name renders as a mostly-blank sheet
 * with a filled footer, which still reads deliberately.
 * Minimum: name + 1 fillable section — below that there is nothing above the
 * anchor and the layout loses its point.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
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
  const body = joinBlocks([
    section("Education", () => educationList(p, SHOW.education)),
    section("Projects", () => projectList(p, SHOW.projects)),
    section("Internships", () => internshipList(p, SHOW.internships)),
    section("Skills", () => chips(p.skills, SHOW.skills)),
    section("Languages", () => chips(p.languages, SHOW.languages)),
    section("About", () => bio(p, SHOW.bioChars)),
    section("Awards", () => achievementList(p, SHOW.achievements)),
    section("Publications", () => publicationList(p, SHOW.publications)),
    section("Activities", () => extracurricularList(p, SHOW.extracurriculars)),
  ]);

  const contact = contactInline(p);
  const socials = socialIcons(p.socialLinks, SHOW.socials);

  const anchor = `<footer class="iv-fa-anchor">
      ${avatar(p, "iv-fa-av")}
      <div class="iv-fa-who">
        ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
        ${nonEmpty(p.designation) ? `<div class="iv-role">${esc(p.designation)}</div>` : ""}
        ${contact ? `<div class="iv-cinline">${contact}</div>` : ""}
        ${logoSlot(theme.logo)}
      </div>
      ${socials ? `<div class="iv-fa-social">${socials}</div>` : ""}
    </footer>`;

  return `<div class="iv-fa-wrap"><main class="iv-fa-body">${body}</main>${anchor}</div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-footer-anchor{background:var(--iv-surface)}
/* Column flex + margin-top:auto is what welds the anchor to the bottom edge at
   any content height. A fixed offset would float or overlap as sections vary. */
${s} .iv-fa-wrap{display:flex;flex-direction:column;min-height:100%}
${s} .iv-fa-body{flex:1 1 auto;padding:1.15em 1.1em .9em}
${s} .iv-fa-body .iv-sec-h:first-child{margin-top:0}

${s} .iv-fa-anchor{margin-top:auto;background:var(--iv-grad);color:var(--iv-onp);padding:.85em 1.1em;display:flex;align-items:center;gap:.7em}
${s} .iv-fa-av{width:2.9em;height:2.9em;box-shadow:0 0 0 2px color-mix(in srgb,var(--iv-onp) 40%,transparent)}
${s} .iv-fa-anchor .iv-av-fallback{background:color-mix(in srgb,var(--iv-onp) 18%,transparent);color:var(--iv-onp)}
${s} .iv-fa-who{min-width:0;flex:1 1 auto}
${s} .iv-fa-anchor .iv-name{font-size:1.05em;color:var(--iv-onp)}
/* The muted token is tuned for a light surface; on the band it would vanish. */
${s} .iv-fa-anchor .iv-role,${s} .iv-fa-anchor .iv-cinline{color:color-mix(in srgb,var(--iv-onp) 78%,transparent)}
${s} .iv-fa-anchor .iv-cinline{font-size:.66em;margin-top:.15em}
${s} .iv-fa-social{flex:0 0 auto}
${s} .iv-fa-anchor .iv-si{background:color-mix(in srgb,var(--iv-onp) 22%,transparent)!important;color:var(--iv-onp)}


/* The logo's dedicated row on this card. */
${s} .iv-fa-body>.iv-logo-slot{margin-bottom:.6em}
</style>`;
}

export const footerAnchor = { build, styles };
