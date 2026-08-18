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
 * The rules between sections are the one fragile part: with sections hidden
 * they must never stack together or trail at the end. `joinBlocks` with a
 * separator handles both, because it drops empties before joining.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { avatar, esc, nonEmpty } from "../helpers";
import { joinBlocks, section } from "../guards";
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

const RULE = '<div class="iv-cp-rule" aria-hidden="true"></div>';

function build(p: CardProfile, theme: ResolvedTheme): string {
  const head = `<header class="iv-cp-head">
      ${avatar(p, "iv-cp-av", theme.logo?.url)}
      ${nonEmpty(p.fullName) ? `<h2 class="iv-cp-name">${esc(p.fullName)}</h2>` : ""}
      ${nonEmpty(p.designation) ? `<div class="iv-cp-role">${esc(p.designation)}</div>` : ""}
    </header>`;

  // Separator-joined, so a hidden section takes its rule with it.
  const body = joinBlocks(
    [
      bio(p, SHOW.bioChars),
      section("Education", () => educationList(p, SHOW.education)),
      section("Projects", () => projectList(p, SHOW.projects)),
      section("Internships", () => internshipList(p, SHOW.internships)),
      section("Certifications", () => certificationList(p, SHOW.certifications)),
      section("Skills", () => chips(p.skills, SHOW.skills)),
      section("Awards", () => achievementList(p, SHOW.achievements)),
      section("Publications", () => publicationList(p, SHOW.publications)),
      section("Activities", () => extracurricularList(p, SHOW.extracurriculars)),
      joinBlocks([contactInline(p), socialIcons(p.socialLinks, SHOW.socials)]),
    ],
    RULE,
  );

  return `<div class="iv-cp-wrap">${head}${
    body ? `<div class="iv-cp-body">${body}</div>` : ""
  }</div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-centre-portrait{background:var(--iv-surface)}
${s} .iv-cp-wrap{padding:1.9em 1.5em 1.6em;text-align:center}
${s} .iv-cp-head{display:flex;flex-direction:column;align-items:center;gap:.5em}
${s} .iv-cp-av{width:4.6em;height:4.6em}

/* No colour block: the initials fallback is an outlined ring, not a filled disc. */
${s} .iv-cp-head .iv-av-fallback{background:transparent;color:var(--iv-primary);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--iv-primary) 40%,transparent)}

${s} .iv-cp-name{font-family:var(--iv-font-h);font-weight:700;font-size:1.35em;line-height:1.15;letter-spacing:-.015em}
${s} .iv-cp-role{font-size:.78em;color:var(--iv-muted);letter-spacing:.06em;text-transform:uppercase}

${s} .iv-cp-body{margin-top:1.2em}
${s} .iv-cp-rule{height:1px;background:color-mix(in srgb,var(--iv-primary) 22%,transparent);margin:1.1em auto;width:60%}
${s} .iv-cp-body .iv-sec-h{margin-top:0;margin-bottom:.5em;letter-spacing:.14em}
${s} .iv-cp-body .iv-bio{margin-top:0;font-size:.82em}
${s} .iv-cp-body .iv-chips{justify-content:center}
${s} .iv-cp-body .iv-socials{justify-content:center;margin-top:.5em}

/* Centred layout: list items lose their dividing lines, spacing carries them. */
${s} .iv-cp-body .iv-item+.iv-item{border-top:none;margin-top:.5em}
${s} .iv-cp-body .iv-chip{background:transparent;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--iv-primary) 30%,transparent)}


</style>`;
}

export const centrePortrait = { build, styles };
