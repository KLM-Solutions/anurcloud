/**
 * Professional template 20 — "Pull Quote" (DEV-3055)
 *
 *   ┌──────────────────────────┐
 *   │ ❝                        │
 *   │ Platform engineering     │
 *   │ leader with a bias for   │
 *   │ boring infrastructure.   │
 *   │ ───                      │
 *   │ PRIYA MENON              │
 *   │ VP Engineering · Zoho    │
 *   │ ──────────────────────── │
 *   │ EXPERIENCE               │
 *   │ Role · Company           │
 *   └──────────────────────────┘
 *
 * Structurally: the identity is the CAPTION, not the headline. The card opens on
 * the person's positioning line set as display type, and the name follows
 * underneath at a fraction of the size, attributed the way a pull quote is. Every
 * other card in the 20 — all nineteen — makes the name the largest or the first
 * thing on it. This one demotes it on purpose.
 *
 * ── Not Letterhead ────────────────────────────────────────────────────────
 * Letterhead (18) is the other card with no fill, and it is the inverse: the name
 * is the biggest thing on it, at the top, framed by rules, with contact set
 * beside it. Here the top third is a block of large sentence text and the name is
 * small type below a short rule. In grayscale one reads as stationery and the
 * other as an editorial page.
 *
 * ── Why this is the only card that requires a bio ──────────────────────────
 * There is no card without the quote — the quote IS the card. So the minimum is a
 * name and a bio, and this is the one layout whose availability depends on
 * Module 3 having run (or on the CV carrying a real summary). That is a feature
 * worth knowing about when it is offered: an enhanced profile unlocks a layout a
 * raw extraction often cannot.
 *
 * The quote is the profile's own words — the enhanced bio if Module 3 ran, else
 * the extracted summary. Nothing is written for the person here.
 *
 * Minimum: name + a bio or summary.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { esc, logoSlot, nonEmpty } from "../helpers";
import { joinBlocks, section } from "../guards";
import {
  achievementList,
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

/**
 * The quote itself — the bio at display size, so it needs its own truncation.
 *
 * The shared `bio()` block wraps the text in `.iv-bio`, which is body-size muted
 * paragraph styling; that is the opposite of what this card wants. Cutting at a
 * word boundary rather than mid-word matters more here than elsewhere: at this
 * size a chopped word is the first thing the eye lands on.
 */
function quote(p: CardProfile, maxChars = 190): string {
  if (!nonEmpty(p.bio)) return "";
  const text = p.bio.trim();
  if (text.length <= maxChars) return esc(text);
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return esc((lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()) + "…";
}

function build(p: CardProfile, theme: ResolvedTheme): string {
  const body = joinBlocks([
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

  return `<div class="iv-pq-wrap">
    <figure class="iv-pq-hero">
      <span class="iv-pq-mark" aria-hidden="true">&ldquo;</span>
      <blockquote class="iv-pq-q">${quote(p)}</blockquote>
      <span class="iv-pq-rule" aria-hidden="true"></span>
      <figcaption class="iv-pq-by">
        <div class="iv-pq-by-txt">
          ${nonEmpty(p.fullName) ? `<div class="iv-pq-name">${esc(p.fullName)}</div>` : ""}
          ${
            nonEmpty(p.designation) || nonEmpty(p.currentCompany)
              ? `<div class="iv-role">${esc(
                  [p.designation, p.currentCompany].filter(nonEmpty).join(" · "),
                )}</div>`
              : ""
          }
          ${contact ? `<div class="iv-pq-contact">${contact}</div>` : ""}
        </div>
        ${logoSlot(theme.logo)}
      </figcaption>
    </figure>
    ${body ? `<main class="iv-pq-body">${body}</main>` : ""}
    ${
      site || socials
        ? `<footer class="iv-pq-foot">${site}${socials}</footer>`
        : ""
    }
  </div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
/* No fill anywhere. The colour appears in the quote mark and the attribution
   rule only — the hierarchy on this card is done entirely with type size.
   (No backticks in this block — it is inside a template literal.) */
${s}.iv-pull-quote{background:var(--iv-surface)}
${s} .iv-pq-wrap{padding:1.3em 1.2em 1.1em}

${s} .iv-pq-hero{display:block}
/* Oversized and tinted rather than a background shape, so it reads as a
   typographic mark. Negative margins let the quote text sit under it instead of
   being pushed down by a glyph twice its own size. */
${s} .iv-pq-mark{display:block;font-family:var(--iv-font-h);font-weight:800;font-size:3em;line-height:.72;color:color-mix(in srgb,var(--iv-primary) 34%,var(--iv-surface));margin-bottom:.05em}
/* The largest type on the card, and the reason the layout exists. */
${s} .iv-pq-q{font-family:var(--iv-font-h);font-weight:600;font-size:1.3em;line-height:1.32;letter-spacing:-.01em;color:var(--iv-text)}
${s} .iv-pq-rule{display:block;width:2.4em;height:2.5px;background:var(--iv-primary);margin:.85em 0 .6em}

${s} .iv-pq-by{display:flex;align-items:flex-start;gap:.6em}
${s} .iv-pq-by-txt{min-width:0;flex:1 1 auto}
/* Deliberately small. The name is the attribution here, not the headline. */
${s} .iv-pq-name{font-family:var(--iv-font-h);font-weight:700;font-size:.82em;letter-spacing:.13em;text-transform:uppercase;line-height:1.3}
${s} .iv-pq-by .iv-role{font-size:.72em;margin-top:.1em}
${s} .iv-pq-contact{margin-top:.3em}

${s} .iv-pq-body{margin-top:1.05em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 24%,transparent)}
${s} .iv-pq-body .iv-sec-h:first-child{margin-top:.8em}

${s} .iv-pq-foot{margin-top:.95em;display:flex;align-items:center;justify-content:space-between;gap:.5em;flex-wrap:wrap}
${s} .iv-pq-foot .iv-cinline{color:var(--iv-primary)}

/* Display type at a narrow measure turns into three words a line, so it steps
   down rather than shredding the quote. */
@container (max-width:320px){
  ${s} .iv-pq-wrap{padding:1.1em 1em 1em}
  ${s} .iv-pq-q{font-size:1.12em}
  ${s} .iv-pq-mark{font-size:2.5em}
}
</style>`;
}

export const pullQuote = { build, styles };
