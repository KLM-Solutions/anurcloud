/**
 * Professional template 16 — "Stat Strip" (DEV-3051)
 *
 *   ┌──────┬──────┬───────┐
 *   │░ 12 ░│░  4 ░│░  6  ░│  ← the card OPENS on figures
 *   │░YEARS│ROLES │ CERTS │
 *   ├──────┴──────┴───────┤
 *   │ Priya Menon  (logo) │
 *   │ VP Engineering·Zoho │
 *   │ ─────────────────── │
 *   │ EXPERIENCE          │
 *   │  Role · Company     │
 *   │   • highlight       │
 *   └─────────────────────┘
 *
 * Structurally: the identity is NOT the first thing on the card. A divided,
 * filled strip of oversized numerals opens it, and the name follows underneath
 * on white. No card in the student pool leads with data, and none divides a
 * colour region into cells.
 *
 * ── The figures are counted, never estimated ──────────────────────────────
 * Years comes from `total_years_experience`, which the document either states or
 * the extractor computes; the rest are counts of things actually listed. Nothing
 * here is inferred, so the card cannot display a figure the CV did not support.
 * A profile that can only fill one figure is not offered this layout at all — one
 * number in a divided strip reads as an error, not as a headline.
 *
 * Thin data: with two figures the strip still reads as a strip; the body below
 * collapses to whatever exists.
 * Minimum: name + 2 headline figures.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { esc, logoSlot, nonEmpty } from "../helpers";
import { joinBlocks, meaningfulEducation, meaningfulExperience, section } from "../guards";
import {
  achievementList,
  bio,
  certificationList,
  chips,
  contactInline,
  educationList,
  experienceHighlights,
  nameBlock,
  publicationList,
  registrationRows,
  socialIcons,
  websiteLine,
} from "../sections";

interface Stat {
  value: string;
  label: string;
}

/**
 * The figures, in priority order, capped at three.
 *
 * Three is a design limit, not a data one: at a 380px card a fourth cell drops
 * each numeral below the size that makes this layout work.
 */
function statCells(p: CardProfile): Stat[] {
  const out: Stat[] = [];

  if (nonEmpty(p.totalYearsExperience)) {
    // "12 years" → "12". Kept as-is when there is no leading number to lift, so
    // an unusual value ("6 months") still shows what the document said.
    const digits = p.totalYearsExperience.match(/\d+/)?.[0];
    out.push(
      digits
        ? { value: digits, label: digits === "1" ? "Year" : "Years" }
        : { value: p.totalYearsExperience.slice(0, 8), label: "Experience" },
    );
  }

  const roles = p.experience.filter(meaningfulExperience).length;
  if (roles > 0) out.push({ value: String(roles), label: roles === 1 ? "Role" : "Roles" });

  const certs = p.certifications.filter((c) => nonEmpty(c.name)).length;
  if (certs > 0) out.push({ value: String(certs), label: certs === 1 ? "Cert" : "Certs" });

  if (p.skills.length > 0) out.push({ value: String(p.skills.length), label: "Skills" });

  const degrees = p.education.filter(meaningfulEducation).length;
  if (degrees > 0) {
    out.push({ value: String(degrees), label: degrees === 1 ? "Degree" : "Degrees" });
  }

  return out.slice(0, 3);
}

function build(p: CardProfile, theme: ResolvedTheme): string {
  const strip = statCells(p)
    .map(
      (s) =>
        `<div class="iv-ss-cell"><div class="iv-ss-n">${esc(s.value)}</div><div class="iv-ss-l">${esc(
          s.label,
        )}</div></div>`,
    )
    .join("");

  const body = joinBlocks([
    section("About", () => bio(p, SHOW.bioChars)),
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

  return `<div class="iv-ss-wrap">
    <div class="iv-ss-strip">${strip}</div>
    <div class="iv-ss-main">
      <header class="iv-ss-id">
        <div class="iv-ss-id-txt">${nameBlock(p)}</div>
        ${logoSlot(theme.logo)}
      </header>
      ${contact ? `<div class="iv-ss-contact">${contact}</div>` : ""}
      ${site}
      ${body ? `<div class="iv-ss-body">${body}</div>` : ""}
      ${socials ? `<div class="iv-ss-social">${socials}</div>` : ""}
    </div>
  </div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-stat-strip{background:var(--iv-surface)}

/* The strip is the card's opening move: full-bleed, filled, and divided into
   equal cells. Equal cells matter — a flexed-to-content strip would read as a
   row of tags rather than as a set of headline figures.
   (No backticks in this block — it is inside a template literal.) */
${s} .iv-ss-strip{display:flex;background:var(--iv-grad);color:var(--iv-onp)}
${s} .iv-ss-cell{flex:1 1 0;min-width:0;padding:.7em .4em .6em;text-align:center}
${s} .iv-ss-cell+.iv-ss-cell{border-left:1px solid color-mix(in srgb,var(--iv-onp) 28%,transparent)}
${s} .iv-ss-n{font-family:var(--iv-font-h);font-weight:800;font-size:1.75em;line-height:1;letter-spacing:-.02em}
${s} .iv-ss-l{font-size:.55em;font-weight:700;text-transform:uppercase;letter-spacing:.12em;margin-top:.35em;color:color-mix(in srgb,var(--iv-onp) 82%,transparent)}

${s} .iv-ss-main{padding:1em 1.05em 1.1em}
${s} .iv-ss-id{display:flex;align-items:flex-start;gap:.6em}
${s} .iv-ss-id-txt{min-width:0;flex:1 1 auto}
${s} .iv-ss-contact{margin-top:.4em}
${s} .iv-ss-body{margin-top:.5em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 20%,transparent);padding-top:.1em}
${s} .iv-ss-body .iv-sec-h:first-child{margin-top:.7em}
${s} .iv-ss-social{margin-top:.8em}

/* Two figures still divide the strip evenly; the cells simply get wider. */
@container (max-width:300px){
  ${s} .iv-ss-n{font-size:1.45em}
  ${s} .iv-ss-l{letter-spacing:.08em}
}
</style>`;
}

export const statStrip = { build, styles };
