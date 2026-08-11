/**
 * Professional template 19 — "Edge Spine" (DEV-3054)
 *
 *   ┌────────────────────────┬──┐
 *   │ VP Engineering · Zoho  │░P│
 *   │ priya@… · +91… ·Chennai│░R│
 *   │ ────────────────────── │░I│
 *   │ EXPERIENCE             │░Y│
 *   │  Role · Company        │░A│
 *   │   • highlight          │░ │
 *   │ SKILLS                 │░M│
 *   │ Go · Kubernetes        │░…│
 *   └────────────────────────┴──┘
 *        ^ the name runs UP the right edge
 *
 * Structurally: the name is set vertically in a narrow filled strip on the right
 * edge, like the spine of a book, and the body takes the rest of the width. It is
 * the only card in the 20 that rotates anything, so it is identified before a
 * word of it is read — including in grayscale, where the vertical strip is the
 * whole silhouette.
 *
 * ── Not Side Rail, not Split Halves ───────────────────────────────────────
 * Side Rail (student 1) is a *left* rail at about a third of the width holding an
 * avatar and contact rows. Split Halves (12) is an equal *right* half holding
 * whole sections. This is a strip barely two characters wide, on the right, that
 * holds exactly one thing: the name. Proportion and rotation both differ, which
 * is two structural axes rather than one.
 *
 * ── The name lives ONLY on the spine ──────────────────────────────────────
 * That is what makes the strip load-bearing instead of decorative — remove it and
 * the card has no name. Two consequences the CSS has to handle rather than hope
 * about:
 *   - the strip stretches to the full card height so long names have room, and
 *     `min-height` on the wrap guarantees some height even on a short card
 *   - the vertical text is allowed to WRAP to a second vertical line, which is
 *     why the spine is sized to its content up to a cap rather than to a fixed
 *     width. "Venkataraghavan Subramanian" turns into two lines, not into a
 *     clipped name.
 *
 * Minimum: name + 2 fillable sections — a spine beside an empty body is a strip,
 * not a card.
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
  contactInline,
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
    section("Languages", () => chips(p.languages, SHOW.languages)),
    section("Awards", () => achievementList(p, SHOW.achievements)),
    section("Publications", () => publicationList(p, SHOW.publications)),
    section("Registrations", () => registrationRows(p, SHOW.registrations)),
  ]);

  const contact = contactInline(p);
  const site = websiteLine(p);
  const socials = socialIcons(p.socialLinks, SHOW.socials);

  return `<div class="iv-es-wrap">
    <div class="iv-es-body">
      <header class="iv-es-head">
        <div class="iv-es-head-txt">
          ${
            nonEmpty(p.designation) || nonEmpty(p.currentCompany)
              ? `<div class="iv-es-role">${esc(
                  [p.designation, p.currentCompany].filter(nonEmpty).join(" · "),
                )}</div>`
              : ""
          }
          ${contact ? `<div class="iv-es-contact">${contact}</div>` : ""}
        </div>
        ${logoSlot(theme.logo)}
      </header>
      ${body ? `<main class="iv-es-main">${body}</main>` : ""}
      ${
        site || socials
          ? `<footer class="iv-es-foot">${site}${socials}</footer>`
          : ""
      }
    </div>
    ${
      nonEmpty(p.fullName)
        ? `<div class="iv-es-spine"><span class="iv-es-name">${esc(p.fullName)}</span></div>`
        : ""
    }
  </div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-edge-spine{background:var(--iv-surface)}

/* min-height is not cosmetic: the spine's height is what gives a vertical name
   room, and a sparse card would otherwise be shorter than its own name.
   (No backticks in this block — it is inside a template literal.) */
${s} .iv-es-wrap{display:flex;align-items:stretch;min-height:16em}
${s} .iv-es-body{flex:1 1 auto;min-width:0;padding:1.15em 1em 1.05em 1.1em;display:flex;flex-direction:column}

/* Sized to its content up to a cap, NOT to a fixed width — see the note about
   wrapping in the header comment. align-items is left at stretch on purpose:
   that is what constrains the vertical text's block size so it can wrap at all. */
${s} .iv-es-spine{flex:0 0 auto;max-width:5.5em;background:var(--iv-grad);color:var(--iv-onp);display:flex;padding:1.05em .55em}
/* text-align does the vertical centring here: in vertical-rl the inline axis IS
   the vertical one, so this is what stops the name sitting pinned at the top of a
   tall strip. Using align-items:center on the spine instead would collapse the
   span to its content height and break the wrapping described above. */
${s} .iv-es-name{writing-mode:vertical-rl;text-orientation:mixed;text-align:center;font-family:var(--iv-font-h);font-weight:700;font-size:1.05em;line-height:1.3;letter-spacing:.07em;text-transform:uppercase}

${s} .iv-es-head{display:flex;align-items:flex-start;gap:.6em;padding-bottom:.65em;border-bottom:1px solid color-mix(in srgb,var(--iv-muted) 22%,transparent)}
${s} .iv-es-head-txt{min-width:0;flex:1 1 auto}
/* The role is the largest type in the body, since the name is on the spine. */
${s} .iv-es-role{font-family:var(--iv-font-h);font-weight:700;font-size:.95em;line-height:1.25}
${s} .iv-es-contact{margin-top:.3em}

${s} .iv-es-main{flex:1 1 auto}
${s} .iv-es-main .iv-sec-h:first-child{margin-top:.75em}
${s} .iv-es-foot{margin-top:.9em;display:flex;align-items:center;justify-content:space-between;gap:.5em;flex-wrap:wrap}
${s} .iv-es-foot .iv-cinline{color:var(--iv-primary)}

/* A narrow card cannot spare 5.5em for a strip and still hold a line of text. */
@container (max-width:320px){
  ${s} .iv-es-spine{max-width:3.6em;padding:.85em .45em}
  ${s} .iv-es-name{font-size:.95em}
}
</style>`;
}

export const edgeSpine = { build, styles };
