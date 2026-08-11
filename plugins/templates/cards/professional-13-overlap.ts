/**
 * Professional template 13 — "Overlap" (DEV-3048)
 *
 *   ┌───────────────────────┐
 *   │░░░░░░░░░░░░░░░ 12 YRS░│  ← filled zone, no name on it
 *   │░░░░░░░░░░░░░░░░░░░░░░░│
 *   │  ┌─────────────────┐  │
 *   │  │ Priya Menon     │  │  ← white plate STRADDLES the edge
 *   │  │ VP Eng · Zoho   │  │
 *   │  └─────────────────┘  │
 *   │  Experience           │
 *   │  Role · Company       │
 *   └───────────────────────┘
 *
 * Structurally: layered. A filled zone runs across the top carrying no identity
 * at all, and a raised white plate is pulled up over its bottom edge so it sits
 * half on the colour and half on the page. The silhouette is a rectangle
 * interrupting a horizontal edge — nothing else in the 20 has depth.
 *
 * ── Not Hero Split ────────────────────────────────────────────────────────
 * Hero Split (student 2) puts the name *inside* a top band, so the band and the
 * identity are one object and the top of the card is a solid ruled rectangle.
 * Here the band is empty of identity, the name sits on a separate white surface
 * with its own shadow, and the top edge of the card is broken rather than solid.
 * Cover the colour and the two are still different: one has a plain header, the
 * other has a floating plate.
 *
 * ── The negative margin is bounded ────────────────────────────────────────
 * The plate is lifted with a fixed em offset that is always smaller than the
 * zone above it, so it can never escape the card. The root clips anyway
 * (`overflow:hidden` in the shared styles), but relying on the clip would mean
 * the plate silently loses its top edge at a large fontScale instead of the
 * layout simply holding.
 *
 * Minimum: name + 2 fillable sections.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { esc, joinParts, logoSlot, nonEmpty } from "../helpers";
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
  // The band carries the standing facts, never the name — that is the plate's job.
  const banner = joinParts(
    [p.totalYearsExperience ? `${p.totalYearsExperience} experience` : null, p.location],
    " · ",
  );

  const body = joinBlocks([
    section("Profile", () => bio(p, SHOW.bioChars)),
    section("Experience", () => experienceHighlights(p, SHOW.roles, SHOW.highlightsPerRole)),
    section("Skills", () => chips(p.skills, SHOW.skills)),
    section("Certifications", () => certificationList(p, SHOW.certifications)),
    section("Education", () => educationList(p, SHOW.education)),
    section("Awards", () => achievementList(p, SHOW.achievements)),
    section("Publications", () => publicationList(p, SHOW.publications)),
    section("Registrations", () => registrationRows(p, SHOW.registrations)),
  ]);

  const contact = contactInline(p);
  const site = websiteLine(p);
  const socials = socialIcons(p.socialLinks, SHOW.socials);

  return `<div class="iv-ov-wrap">
    <div class="iv-ov-zone">${banner ? `<div class="iv-ov-banner">${esc(banner)}</div>` : ""}</div>
    <div class="iv-ov-plate">
      <div class="iv-ov-plate-txt">
        ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
        ${
          nonEmpty(p.designation) || nonEmpty(p.currentCompany)
            ? `<div class="iv-role">${esc(
                [p.designation, p.currentCompany].filter(nonEmpty).join(" · "),
              )}</div>`
            : ""
        }
        ${contact ? `<div class="iv-ov-contact">${contact}</div>` : ""}
      </div>
      ${logoSlot(theme.logo)}
    </div>
    ${body ? `<main class="iv-ov-body">${body}</main>` : ""}
    ${
      site || socials
        ? `<footer class="iv-ov-foot">${site}${socials}</footer>`
        : ""
    }
  </div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-overlap{background:var(--iv-surface)}

/* The zone is deliberately taller than the plate's lift, so the plate always
   straddles an edge rather than clearing it or hanging off the card.
   Two things keep the banner and the plate off each other, and both are needed:
     - min-height rather than height, so a banner that wraps grows the zone
       instead of overflowing it
     - a bottom padding LARGER than the plate's lift, which reserves the strip the
       plate is going to cover. Without it a two-line banner (which is what
       "18 years experience · Thiruvananthapuram" becomes at 320px) ended 0.25em
       inside that strip and the plate printed over it — 6.1px of overlap, found by
       check:overflow rather than by eye.
   If the lift below is ever changed, this padding has to stay bigger than it.
   (No backticks in this block — it is inside a template literal.) */
${s} .iv-ov-zone{background:var(--iv-grad);color:var(--iv-onp);min-height:4.6em;padding:.7em 1.05em 2.6em;display:flex;align-items:flex-start;justify-content:flex-end}
${s} .iv-ov-banner{font-size:.62em;font-weight:700;text-transform:uppercase;letter-spacing:.11em;color:color-mix(in srgb,var(--iv-onp) 85%,transparent);text-align:right;max-width:70%}

/* margin-top is the lift. Keep it below the zone height above. The shadow is
   what sells the layering — without it the plate reads as a notch cut out of
   the band rather than as a surface sitting on top of it. */
${s} .iv-ov-plate{position:relative;z-index:1;margin:-2.3em .9em 0;background:var(--iv-surface);border-radius:calc(var(--iv-radius) * .5);padding:.8em .9em;display:flex;align-items:flex-start;gap:.6em;box-shadow:0 2px 4px rgba(15,23,42,.06),0 12px 24px -12px rgba(15,23,42,.28);border:1px solid color-mix(in srgb,var(--iv-muted) 14%,transparent)}
${s} .iv-ov-plate-txt{min-width:0;flex:1 1 auto}
${s} .iv-ov-plate .iv-name{font-size:1.12em}
${s} .iv-ov-contact{margin-top:.3em}

${s} .iv-ov-body{padding:.9em 1.05em 0}
${s} .iv-ov-body .iv-sec-h:first-child{margin-top:.2em}

${s} .iv-ov-foot{padding:.9em 1.05em 1.05em;display:flex;align-items:center;justify-content:space-between;gap:.5em;flex-wrap:wrap}
${s} .iv-ov-foot .iv-cinline{color:var(--iv-primary)}

@container (max-width:320px){
  ${s} .iv-ov-plate{margin-left:.65em;margin-right:.65em;padding:.7em .75em}
}
</style>`;
}

export const overlap = { build, styles };
