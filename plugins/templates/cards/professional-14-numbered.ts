/**
 * Professional template 14 — "Numbered" (DEV-3049)
 *
 *   ┌────────────────────────┐
 *   │ 00  PRIYA MENON        │
 *   │     VP Eng · Zoho      │
 *   │                        │
 *   │ 01  EXPERIENCE         │
 *   │     Role · Company     │
 *   │      • highlight       │
 *   │                        │
 *   │ 02  SKILLS             │
 *   │     Go · Kubernetes    │
 *   └────────────────────────┘
 *      ^ oversized tinted numerals
 *
 * Structurally: an editorial contents page. Every section is numbered in
 * sequence in a left gutter, at a size that makes the numerals a graphic element
 * rather than a label, and the sections are separated by whitespace instead of
 * by rules. Identity is section 00 — it is numbered like everything else, which
 * is the conceit.
 *
 * ── Not Index Ledger ──────────────────────────────────────────────────────
 * Index Ledger (student 9) is the other card built on a left gutter, and it is
 * the opposite in every choice that matters: right-aligned *word* labels at 0.6em,
 * a hairline between every row, and content packed tight beside the label. Here
 * the gutter holds numerals at three times that size, left-aligned, with no rules
 * anywhere and the content set below its own heading. One reads as a spec sheet,
 * the other as a magazine.
 *
 * ── Why the numerals are filled, not outlined ─────────────────────────────
 * An outlined numeral (`-webkit-text-stroke` over transparent text) is the
 * obvious way to draw these, and it fails the requirement that every card
 * survives being turned into a PDF: print paths that drop the stroke leave
 * transparent text, so the numbers vanish and the gutter becomes an unexplained
 * empty column. A light tint of the brand colour is the same effect with no way
 * to disappear.
 *
 * ── The numbering is of what rendered ─────────────────────────────────────
 * Sections are built first, empties dropped, and only then numbered — so a
 * profile with no certifications never produces a card that runs 01, 03, 04.
 *
 * Minimum: name + 3 fillable sections. Below that the numbering is a gimmick
 * attached to two items.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { esc, logoSlot, nonEmpty } from "../helpers";
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

/** A numbered row. Built as a pair so numbering can happen after the filtering. */
interface Row {
  title: string;
  body: string;
}

function rows(p: CardProfile): Row[] {
  const candidates: Row[] = [
    { title: "Profile", body: bio(p, SHOW.bioChars) },
    { title: "Experience", body: experienceHighlights(p, SHOW.roles, SHOW.highlightsPerRole) },
    { title: "Skills", body: chips(p.skills, SHOW.skills) },
    { title: "Certifications", body: certificationList(p, SHOW.certifications) },
    { title: "Awards", body: achievementList(p, SHOW.achievements) },
    { title: "Publications", body: publicationList(p, SHOW.publications) },
    { title: "Registrations", body: registrationRows(p, SHOW.registrations) },
    { title: "Education", body: educationList(p, SHOW.education) },
    { title: "Languages", body: chips(p.languages, SHOW.languages) },
  ];
  return candidates.filter((r) => r.body.trim().length > 0);
}

function build(p: CardProfile, theme: ResolvedTheme): string {
  const contact = contactInline(p);
  const site = websiteLine(p);
  const socials = socialIcons(p.socialLinks, SHOW.socials);

  const identity = `<div class="iv-nb-row">
    <div class="iv-nb-n">00</div>
    <div class="iv-nb-c">
      ${nonEmpty(p.fullName) ? `<div class="iv-nb-name">${esc(p.fullName)}</div>` : ""}
      ${
        nonEmpty(p.designation) || nonEmpty(p.currentCompany)
          ? `<div class="iv-role">${esc(
              [p.designation, p.currentCompany].filter(nonEmpty).join(" · "),
            )}</div>`
          : ""
      }
      ${contact ? `<div class="iv-nb-contact">${contact}</div>` : ""}
      ${logoSlot(theme.logo)}
    </div>
  </div>`;

  const numbered = rows(p)
    .map(
      (r, i) => `<div class="iv-nb-row">
        <div class="iv-nb-n">${String(i + 1).padStart(2, "0")}</div>
        <div class="iv-nb-c"><h3 class="iv-nb-t">${esc(r.title)}</h3>${r.body}</div>
      </div>`,
    )
    .join("");

  return `<div class="iv-nb-wrap">${identity}${numbered}${
    site || socials ? `<footer class="iv-nb-foot">${site}${socials}</footer>` : ""
  }</div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
/* No fill and no rules. The only graphic elements are the numerals themselves,
   which is what keeps this readable as an editorial page rather than a form.
   (No backticks in this block — it is inside a template literal.) */
${s}.iv-numbered{background:var(--iv-surface)}
${s} .iv-nb-wrap{padding:1.25em 1.15em 1.1em}

${s} .iv-nb-row{display:grid;grid-template-columns:2.5em 1fr;gap:.65em;align-items:start}
${s} .iv-nb-row+.iv-nb-row{margin-top:1.05em}

/* Tinted rather than outlined so the numerals survive a print path that drops
   text strokes. Mixed toward the surface, not toward transparent, for the same
   reason the card border is: translucency is unreliable in PDF. */
${s} .iv-nb-n{font-family:var(--iv-font-h);font-weight:800;font-size:1.55em;line-height:.95;letter-spacing:-.04em;color:color-mix(in srgb,var(--iv-primary) 32%,var(--iv-surface));text-align:left}
${s} .iv-nb-c{min-width:0}

${s} .iv-nb-name{font-family:var(--iv-font-h);font-weight:700;font-size:1.15em;line-height:1.15;letter-spacing:.02em;text-transform:uppercase}
${s} .iv-nb-contact{margin-top:.3em}

${s} .iv-nb-t{font-family:var(--iv-font-h);font-size:.62em;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.4em}
${s} .iv-nb-c .iv-bio{margin-top:0}
${s} .iv-nb-c .iv-item+.iv-item{border-top:none;margin-top:.45em}

${s} .iv-nb-foot{margin-top:1.15em;display:flex;align-items:center;justify-content:space-between;gap:.5em;flex-wrap:wrap}
${s} .iv-nb-foot .iv-cinline{color:var(--iv-primary)}

@container (max-width:320px){
  ${s} .iv-nb-row{grid-template-columns:2em 1fr;gap:.5em}
  ${s} .iv-nb-n{font-size:1.3em}
}
</style>`;
}

export const numbered = { build, styles };
