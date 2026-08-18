/**
 * Professional template 22 — "Spotlight" (DEV-3070)
 *
 *   ┌────────────────────────────┐
 *   │⬤⬤⬤                          │
 *   │ ⬤⬤   ARUN KUMAR            │
 *   │  ⬤   Senior Engineer       │
 *   │      Acme · Chennai        │
 *   │                            │
 *   │ Profile ...                │
 *   │ Experience ...             │
 *   └────────────────────────────┘
 *      ^ oversized ringed avatar, bleeding the top-left corner
 *
 * Structurally: the identity is a large ringed portrait anchored into the
 * top-left corner — big enough to be a graphic element, pulled up and left so the
 * card's own overflow clips its ring against the corner. The name sits to its
 * right, baseline-aligned to the foot of the circle, and the body runs full-width
 * below in a single column.
 *
 * ── One of the two professional AVATAR cards (owner's call, 18 Aug 2026) ──────
 * The other ten professional cards carry no identity circle by design (the
 * client's 3 Aug "look-alike" note). Spotlight and Badge are the deliberate
 * exceptions so a professional who uploads a logo has a home for it — the logo
 * fills the circle in place of the initials.
 *
 * ── Not Centre Portrait, not Badge ──────────────────────────────────────────
 * Centre Portrait (student 3) is small, centred and symmetrical, with no ring and
 * no colour. This is the opposite reading: one big off-centre disc anchored to a
 * corner, asymmetric, with a brand-tinted ring. And where Badge boxes a small
 * photo inside a bordered panel, Spotlight lets a large portrait run off the edge
 * with no panel at all. All three are distinct in grayscale.
 *
 * Minimum: name + 2 fillable sections — a portrait over an empty body is a stub.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { avatar, esc, nonEmpty } from "../helpers";
import { section, joinBlocks } from "../guards";
import {
  achievementList,
  bio,
  certificationList,
  chips,
  contactInline,
  educationList,
  experienceHighlights,
  projectList,
  publicationList,
  registrationRows,
  socialIcons,
  websiteLine,
} from "../sections";

function build(p: CardProfile, theme: ResolvedTheme): string {
  const contact = contactInline(p);
  const site = websiteLine(p);
  const socials = socialIcons(p.socialLinks, SHOW.socials);
  const sub = [p.designation, p.currentCompany].filter(nonEmpty).join(" · ");

  const head = `<header class="iv-sp-head">
      ${avatar(p, "iv-sp-av", theme.logo?.url)}
      <div class="iv-sp-who">
        ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
        ${sub ? `<div class="iv-role">${esc(sub)}</div>` : ""}
        ${contact ? `<div class="iv-sp-contact">${contact}</div>` : ""}
      </div>
    </header>`;

  const body = joinBlocks([
    section("Profile", () => bio(p, SHOW.bioChars)),
    section("Experience", () => experienceHighlights(p, SHOW.roles, SHOW.highlightsPerRole)),
    section("Skills", () => chips(p.skills, SHOW.skills)),
    section("Projects", () => projectList(p, SHOW.projects)),
    section("Certifications", () => certificationList(p, SHOW.certifications)),
    section("Awards", () => achievementList(p, SHOW.achievements)),
    section("Publications", () => publicationList(p, SHOW.publications)),
    section("Registrations", () => registrationRows(p, SHOW.registrations)),
    section("Education", () => educationList(p, SHOW.education)),
    section("Languages", () => chips(p.languages, SHOW.languages)),
  ]);

  const foot =
    site || socials ? `<footer class="iv-sp-foot">${site}${socials}</footer>` : "";

  return `<div class="iv-sp-wrap">${head}<main class="iv-sp-body">${body}</main>${foot}</div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-spotlight{background:var(--iv-surface)}
${s} .iv-sp-wrap{padding:1.2em 1.1em 1.1em}

/* align-items:flex-end so the name sits at the foot of the portrait, not its
   middle — the portrait is the taller element and should read as the anchor. */
${s} .iv-sp-head{display:flex;align-items:flex-end;gap:.9em;margin-bottom:1.05em}

/* Oversized and pulled toward the corner. The negative margins let the card's own
   overflow:hidden clip the ring against the top-left corner, which is the bleed
   the layout is named for; the double box-shadow ring is a surface gap plus a
   brand tint, both opaque so a print path keeps them.
   (No backticks in this block — it is inside a template literal.) */
${s} .iv-sp-av{width:5.4em;height:5.4em;flex:0 0 auto;margin:-.45em 0 -.15em -.25em;box-shadow:0 0 0 4px var(--iv-surface),0 0 0 6px color-mix(in srgb,var(--iv-primary) 28%,var(--iv-surface))}
${s} .iv-sp-who{min-width:0;padding-bottom:.15em}
${s} .iv-sp-who .iv-name{font-size:1.3em;line-height:1.15}
${s} .iv-sp-contact{margin-top:.3em}

${s} .iv-sp-body .iv-sec-h:first-child{margin-top:0}
${s} .iv-sp-body .iv-item+.iv-item{margin-top:.4em}

${s} .iv-sp-foot{margin-top:1.05em;padding-top:.7em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 20%,transparent);display:flex;align-items:center;justify-content:space-between;gap:.5em;flex-wrap:wrap}
${s} .iv-sp-foot .iv-cinline{color:var(--iv-primary)}

@container (max-width:320px){
  ${s} .iv-sp-av{width:4.6em;height:4.6em}
  ${s} .iv-sp-who .iv-name{font-size:1.15em}
}
</style>`;
}

export const spotlight = { build, styles };
