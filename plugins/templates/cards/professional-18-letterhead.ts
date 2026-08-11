/**
 * Professional template 18 — "Letterhead" (DEV-3053)
 *
 *   ┌───────────────────────────┐
 *   │ ═════════════════════════ │
 *   │ PRIYA MENON    priya@…    │
 *   │ VP Engineering  +91 90…   │
 *   │ ───────────────────────── │
 *   │   Experience              │
 *   │   Role · Company          │
 *   │                           │
 *   │   Skills                  │
 *   │ ───────────────────────── │
 *   │ zoho.com                  │
 *   └───────────────────────────┘
 *
 * Structurally: a business letterhead. A rule above the name and a rule below
 * the header block; contact set right-aligned *beside* the name rather than
 * under it; wide margins; one narrow measure of text; a closing rule with the
 * website on it. No fill of any kind — the only colour is in the rules.
 *
 * ── Not Centre Portrait ───────────────────────────────────────────────────
 * Centre Portrait (student 3) is the other card with no colour block, and the
 * two are deliberately opposite: that one is centred with everything on one
 * axis, this one is left-aligned with a second right-aligned column in the
 * header. Rules run edge to edge here and are hairline separators there. In
 * grayscale one reads as an invitation and the other as stationery.
 *
 * Thin data: this is the layout that survives it best in the professional pool.
 * A name, a title and a rule is a complete letterhead — there is nothing missing
 * to notice, which is exactly why it accepts a name alone.
 * Minimum: name only.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { esc, logoSlot, nonEmpty } from "../helpers";
import { joinBlocks, section } from "../guards";
import {
  achievementList,
  bio,
  certificationList,
  chips,
  educationList,
  experienceHighlights,
  publicationList,
  registrationRows,
  socialIcons,
  websiteLine,
} from "../sections";

/** Contact set as its own right-aligned column, not as an inline run. */
function contactColumn(p: CardProfile): string {
  const lines = [p.email, p.phone, p.location].filter(nonEmpty);
  if (lines.length === 0) return "";
  return `<div class="iv-lh-contact">${lines
    .map((v) => `<div>${esc(v)}</div>`)
    .join("")}</div>`;
}

function build(p: CardProfile, theme: ResolvedTheme): string {
  const body = joinBlocks([
    section("Profile", () => bio(p, SHOW.bioChars)),
    section("Experience", () => experienceHighlights(p, SHOW.roles, SHOW.highlightsPerRole)),
    section("Education", () => educationList(p, SHOW.education)),
    section("Certifications", () => certificationList(p, SHOW.certifications)),
    section("Skills", () => chips(p.skills, SHOW.skills)),
    section("Languages", () => chips(p.languages, SHOW.languages)),
    section("Awards", () => achievementList(p, SHOW.achievements)),
    section("Publications", () => publicationList(p, SHOW.publications)),
    section("Registrations", () => registrationRows(p, SHOW.registrations)),
  ]);

  const site = websiteLine(p);
  const socials = socialIcons(p.socialLinks, SHOW.socials);
  const foot = site || socials;

  return `<div class="iv-lh-wrap">
    <header class="iv-lh-head">
      <div class="iv-lh-id">
        ${nonEmpty(p.fullName) ? `<div class="iv-lh-name">${esc(p.fullName)}</div>` : ""}
        ${
          nonEmpty(p.designation) || nonEmpty(p.currentCompany)
            ? `<div class="iv-lh-role">${esc(
                [p.designation, p.currentCompany].filter(nonEmpty).join(" · "),
              )}</div>`
            : ""
        }
        ${logoSlot(theme.logo)}
      </div>
      ${contactColumn(p)}
    </header>
    ${body ? `<main class="iv-lh-body">${body}</main>` : ""}
    ${
      foot
        ? `<footer class="iv-lh-foot">${site}${
            socials ? `<div class="iv-lh-social">${socials}</div>` : ""
          }</footer>`
        : ""
    }
  </div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
/* Stationery, not a poster: no fill anywhere, generous margins, and every
   horizontal division carried by a rule.
   (No backticks in this block — it is inside a template literal.) */
${s}.iv-letterhead{background:var(--iv-surface)}
${s} .iv-lh-wrap{padding:1.5em 1.45em 1.2em}

/* The double rule is the letterhead signature: a heavy one over the name and a
   hairline under the whole header block. */
${s} .iv-lh-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1em;border-top:2.5px solid var(--iv-primary);padding-top:.75em;padding-bottom:.75em;border-bottom:1px solid color-mix(in srgb,var(--iv-muted) 32%,transparent)}
${s} .iv-lh-id{min-width:0;flex:1 1 auto}
${s} .iv-lh-name{font-family:var(--iv-font-h);font-weight:700;font-size:1.2em;line-height:1.15;letter-spacing:.06em;text-transform:uppercase}
${s} .iv-lh-role{font-size:.72em;color:var(--iv-muted);margin-top:.3em;letter-spacing:.02em}

/* Right-aligned contact beside the name — the detail that separates this from
   every stacked identity in the set. */
${s} .iv-lh-contact{flex:0 1 auto;text-align:right;font-size:.66em;line-height:1.65;color:var(--iv-muted);overflow-wrap:anywhere;max-width:48%}

${s} .iv-lh-body{padding-top:.2em}
/* A narrow measure. Letterheads are read as documents, and a full-bleed line
   length at this size is not. */
${s} .iv-lh-body .iv-sec-h{margin:1.05em 0 .35em;letter-spacing:.14em;color:var(--iv-text);opacity:.55}
${s} .iv-lh-body .iv-sec-h:first-child{margin-top:.9em}
${s} .iv-lh-body .iv-bio{margin-top:0}
${s} .iv-lh-body .iv-item+.iv-item{border-top:none;margin-top:.5em;padding-top:0}

${s} .iv-lh-foot{margin-top:1.1em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 32%,transparent);padding-top:.6em;display:flex;align-items:center;justify-content:space-between;gap:.6em;flex-wrap:wrap}
${s} .iv-lh-foot .iv-cinline{font-size:.66em;color:var(--iv-primary)}

@container (max-width:320px){
  ${s} .iv-lh-wrap{padding:1.15em 1.05em 1em}
  ${s} .iv-lh-head{flex-direction:column;gap:.5em}
  ${s} .iv-lh-contact{text-align:left;max-width:100%}
}
</style>`;
}

export const letterhead = { build, styles };
