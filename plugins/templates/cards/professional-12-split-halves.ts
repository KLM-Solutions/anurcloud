/**
 * Professional template 12 — "Split Halves" (DEV-3047)
 *
 *   ┌───────────┬───────────┐
 *   │ Priya     │░░░░░░░░░░░│
 *   │ Menon     │░ SKILLS  ░│
 *   │ VP Eng    │░ Go · K8s ░│
 *   │           │░          ░│
 *   │ EXPERIENCE│░ CERTS   ░│
 *   │ Role·Co   │░ CKA      ░│
 *   │  • point  │░          ░│
 *   │           │░ CONTACT ░│
 *   │           │░ priya@… ░│
 *   └───────────┴───────────┘
 *
 * Structurally: two equal full-height halves meeting on a single line down the
 * middle, colour on the right. Both halves carry sections — this is a split, not
 * a body with a sidebar.
 *
 * ── Not Side Rail ─────────────────────────────────────────────────────────
 * Side Rail (student 1) is a narrow left rail at about a third of the width,
 * carrying an avatar and contact only, and it collapses to a bare strip when
 * there is no contact. This is 50/50, the colour is on the *right*, there is no
 * avatar anywhere on it, and the coloured half holds real content — skills,
 * certifications, languages. Set side by side in grayscale the balance point is
 * obviously different, which is the whole test.
 *
 * ── Why it needs three sections ───────────────────────────────────────────
 * An empty half is not a design. The minimum is set so that both columns have
 * something to hold; below it the layout is not offered and a single-column card
 * is suggested instead.
 *
 * Minimum: name + 3 fillable sections.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { NARROW, SHOW } from "../limits";
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

/**
 * Contact as plain stacked lines, not `contactRows`.
 *
 * The shared rows block reserves a 4.2em label gutter, which is fine across a
 * full-width card and wrong in a half one: at 190px the labels wrap ("E-" over
 * "MAIL") and the values step in and out. A half-width column has no room for a
 * gutter, so this drops the labels rather than the values.
 */
function contactStack(p: CardProfile): string {
  const lines = [p.phone, p.email, p.location].filter(nonEmpty);
  if (lines.length === 0) return "";
  return `<div class="iv-sh-contact">${lines
    .map((v) => `<div class="iv-sh-cline">${esc(v)}</div>`)
    .join("")}</div>`;
}

function build(p: CardProfile, theme: ResolvedTheme): string {
  /*
   * NARROW throughout: each half is about 190px on a 380px card, so this is the
   * one layout where the full SHOW ceiling is actively wrong — six roles with four
   * bullets each in a 190px column is a wall of text, and the balance between the
   * halves is the whole point of the card.
   * Career content on the left, credentials on the right, which is also where the
   * two new professional families naturally fall.
   */
  const left = joinBlocks([
    section("Profile", () => bio(p, 150)),
    section("Experience", () => experienceHighlights(p, NARROW.roles, NARROW.highlightsPerRole)),
    section("Education", () => educationList(p, NARROW.education)),
  ]);

  const right = joinBlocks([
    section("Skills", () => chips(p.skills, NARROW.skills)),
    section("Certifications", () => certificationList(p, NARROW.certifications)),
    section("Awards", () => achievementList(p, NARROW.achievements)),
    section("Papers", () => publicationList(p, NARROW.publications)),
    section("Registrations", () => registrationRows(p, NARROW.registrations)),
    section("Languages", () => chips(p.languages, NARROW.languages)),
    section("Contact", () => contactStack(p)),
  ]);

  const site = websiteLine(p);
  const socials = socialIcons(p.socialLinks, SHOW.socials);

  return `<div class="iv-sh-wrap">
    <div class="iv-sh-left">
      <header class="iv-sh-id">
        ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
        ${
          nonEmpty(p.designation) || nonEmpty(p.currentCompany)
            ? `<div class="iv-role">${esc(
                [p.designation, p.currentCompany].filter(nonEmpty).join(" · "),
              )}</div>`
            : ""
        }
        ${logoSlot(theme.logo)}
      </header>
      ${left}
      ${site ? `<div class="iv-sh-site">${site}</div>` : ""}
    </div>
    <aside class="iv-sh-right">
      ${right}
      ${socials ? `<div class="iv-sh-social">${socials}</div>` : ""}
    </aside>
  </div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-split-halves{background:var(--iv-surface)}

/* Equal halves, full height. 1fr 1fr rather than a rail ratio is the structural
   claim of this card — align-items:stretch is what makes the coloured half run
   to the bottom edge whichever column is taller.
   (No backticks in this block — it is inside a template literal.) */
${s} .iv-sh-wrap{display:grid;grid-template-columns:1fr 1fr;align-items:stretch;min-height:100%}

${s} .iv-sh-left{padding:1.1em .85em 1em 1em;min-width:0}
${s} .iv-sh-id .iv-name{font-size:1.15em}
${s} .iv-sh-left .iv-sec-h{margin:.9em 0 .35em}
${s} .iv-sh-left .iv-bio{font-size:.72em}
${s} .iv-sh-left .iv-item-t{font-size:.74em}
${s} .iv-sh-left .iv-item-m{font-size:.64em}
${s} .iv-sh-site{margin-top:.8em}

/* The coloured half. Every token tuned for a light surface has to be restated
   here or it disappears into the fill — muted text on a saturated ground is the
   classic way a themed card becomes unreadable at a brand colour nobody tested. */
${s} .iv-sh-right{background:var(--iv-grad);color:var(--iv-onp);padding:1.1em 1em 1em .85em;min-width:0}
${s} .iv-sh-right .iv-sec-h{color:color-mix(in srgb,var(--iv-onp) 88%,transparent);margin:.9em 0 .35em}
${s} .iv-sh-right .iv-sec-h:first-child{margin-top:0}
${s} .iv-sh-right .iv-chip{background:color-mix(in srgb,var(--iv-onp) 18%,transparent);color:var(--iv-onp)}
${s} .iv-sh-right .iv-item-t{font-size:.72em;color:var(--iv-onp)}
${s} .iv-sh-right .iv-item-m{font-size:.63em;color:color-mix(in srgb,var(--iv-onp) 75%,transparent)}
${s} .iv-sh-right .iv-item+.iv-item{border-top-color:color-mix(in srgb,var(--iv-onp) 22%,transparent)}
/* No label gutter — see contactStack() for why. */
${s} .iv-sh-cline{font-size:.66em;line-height:1.6;overflow-wrap:anywhere}
${s} .iv-sh-right .iv-si{background:color-mix(in srgb,var(--iv-onp) 22%,transparent)!important;color:var(--iv-onp)}
${s} .iv-sh-social{margin-top:.9em}

/* Below this width two halves stop being readable as columns and become two
   very narrow ones, so the split unwinds into stacked zones. The colour block
   stays second, which keeps the card recognisable as this template. */
@container (max-width:300px){
  ${s} .iv-sh-wrap{grid-template-columns:1fr}
  ${s} .iv-sh-right{padding:1em}
}
</style>`;
}

export const splitHalves = { build, styles };
