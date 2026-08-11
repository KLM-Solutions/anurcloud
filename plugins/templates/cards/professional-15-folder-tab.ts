/**
 * Professional template 15 — "Folder Tab" (DEV-3050)
 *
 *   ┌──────────────────┐
 *   │░░░░░░░░░░░░░┐    │  ← the tab stops short of the right edge
 *   │░Priya Menon ░│    │
 *   │░VP Eng·Zoho ░│    │
 *   ├══════════════════┤  ← the tab's base continues as a full rule
 *   │ EXPERIENCE       │
 *   │ Role · Company   │
 *   │ SKILLS           │
 *   └──────────────────┘
 *
 * Structurally: a file folder. The identity sits on a part-width tab that stops
 * short of the right edge, and the tab's bottom edge continues across the whole
 * card as a heavy rule. The top edge of the card is therefore asymmetric — filled
 * on the left, bare on the right — which is a silhouette nothing else in the 20
 * has.
 *
 * ── Not Monogram Block ────────────────────────────────────────────────────
 * Monogram Block (student 8) is the other part-width colour block, and the two
 * differ in every dimension that reads at a glance: that one is roughly square,
 * holds oversized *initials* and nothing else, and the name sits beside it on
 * white. This one is wide and shallow, holds the *name and title itself*, and has
 * nothing beside it — the space to its right is empty page. It also has the rule,
 * which is the part that makes it read as a tab rather than as a block.
 *
 * ── Why the tab is inline-block and not a width ───────────────────────────
 * The tab sizes to its content up to a cap, so a short name gets a short tab and
 * a long one gets a long tab that still stops before the edge. A fixed
 * percentage would leave "Raj K" floating on a half-empty tab, which reads as a
 * layout bug rather than as a design.
 *
 * Thin data: a tab with a name on it and an empty sheet below is a coherent
 * object — a folder that happens to be empty. That is why it accepts a name
 * alone, which only three other cards in the 20 do.
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
  contactRows,
  educationList,
  experienceHighlights,
  publicationList,
  registrationRows,
  socialIcons,
  websiteLine,
} from "../sections";

function build(p: CardProfile, theme: ResolvedTheme): string {
  const body = joinBlocks([
    section("Profile", () => bio(p, SHOW.bioChars)),
    section("Experience", () => experienceHighlights(p, SHOW.roles, SHOW.highlightsPerRole)),
    section("Skills", () => chips(p.skills, SHOW.skills)),
    section("Certifications", () => certificationList(p, SHOW.certifications)),
    section("Education", () => educationList(p, SHOW.education)),
    section("Contact", () => contactRows(p)),
    section("Awards", () => achievementList(p, SHOW.achievements)),
    section("Publications", () => publicationList(p, SHOW.publications)),
    section("Registrations", () => registrationRows(p, SHOW.registrations)),
  ]);

  const site = websiteLine(p);
  const socials = socialIcons(p.socialLinks, SHOW.socials);

  return `<div class="iv-ft-wrap">
    <div class="iv-ft-head">
      <div class="iv-ft-tab">
        ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
        ${
          nonEmpty(p.designation) || nonEmpty(p.currentCompany)
            ? `<div class="iv-role">${esc(
                [p.designation, p.currentCompany].filter(nonEmpty).join(" · "),
              )}</div>`
            : ""
        }
        ${logoSlot(theme.logo)}
      </div>
    </div>
    ${body ? `<main class="iv-ft-body">${body}</main>` : ""}
    ${
      site || socials
        ? `<footer class="iv-ft-foot">${site}${socials}</footer>`
        : ""
    }
  </div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-folder-tab{background:var(--iv-surface)}

/* The head is the rule; the tab sits on top of it and stops short of the right
   edge. Together they make the asymmetric top the card is named for.
   (No backticks in this block — it is inside a template literal.) */
${s} .iv-ft-head{border-bottom:.28em solid var(--iv-primary);line-height:0}

/* inline-block so the tab is as wide as its content and no wider, capped so it
   always leaves page visible to its right. The right corner is rounded and the
   left one follows the card, which is what reads as a tab rather than a band. */
${s} .iv-ft-tab{display:inline-block;line-height:1.45;max-width:80%;min-width:45%;background:var(--iv-grad);color:var(--iv-onp);padding:.85em 1.1em .75em;border-radius:max(0px, calc(var(--iv-radius) - 2px)) .85em 0 0}
${s} .iv-ft-tab .iv-name{font-size:1.12em;color:var(--iv-onp)}
/* The muted token is tuned for a light surface; on the tab it would vanish. */
${s} .iv-ft-tab .iv-role{color:color-mix(in srgb,var(--iv-onp) 80%,transparent)}

${s} .iv-ft-body{padding:.7em 1.1em 0}
${s} .iv-ft-body .iv-sec-h:first-child{margin-top:.7em}

${s} .iv-ft-foot{padding:.9em 1.1em 1.05em;display:flex;align-items:center;justify-content:space-between;gap:.5em;flex-wrap:wrap}
${s} .iv-ft-foot .iv-cinline{color:var(--iv-primary)}

/* On a narrow card an 80% cap leaves a sliver of page, which reads as a mistake
   rather than as a tab. Widen the tab and let the rule do more of the work. */
@container (max-width:320px){
  ${s} .iv-ft-tab{max-width:88%;padding:.75em .9em .65em}
}
</style>`;
}

export const folderTab = { build, styles };
