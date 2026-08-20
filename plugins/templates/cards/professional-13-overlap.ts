import type { CardProfile } from "../types";
import { SHOW } from "../limits";
import { esc, joinParts, nonEmpty } from "../helpers";
import { joinBlocks, section } from "../guards";
import { linesForItems, linesForText, type PageBlock, type PagedContent } from "../pagination";
import {
  achievementList,
  bio,
  certificationList,
  chips,
  contactInline,
  educationList,
  experienceGroup,
  projectList,
  publicationList,
  registrationRows,
  socialIcons,
  websiteLine,
} from "../sections";


/**
 * The body sections, in order — the ONE list both render paths consume, each
 * carrying an estimated weight for pagination. The zone + plate are chrome and
 * stay on page 1; only these flow onto continuation pages.
 */
function bodyBlocks(p: CardProfile): PageBlock[] {
  const out: PageBlock[] = [];
  const add = (html: string, weight: number) => {
    if (html.trim()) out.push({ html, weight });
  };
  add(section("Profile", () => bio(p, SHOW.bioChars)), linesForText(p.bio));
  const exp = experienceGroup(p, SHOW.roles, SHOW.highlightsPerRole);
  if (exp) out.push(exp);
  add(section("Projects", () => projectList(p, SHOW.projects)), linesForItems(p.projects.length, 3));
  add(section("Skills", () => chips(p.skills, SHOW.skills)), Math.ceil(p.skills.length / 3) + 1);
  add(section("Certifications", () => certificationList(p, SHOW.certifications)), linesForItems(p.certifications.length));
  add(section("Education", () => educationList(p, SHOW.education)), linesForItems(p.education.length));
  add(section("Languages", () => chips(p.languages, SHOW.languages)), Math.ceil(p.languages.length / 4) + 1);
  add(section("Awards", () => achievementList(p, SHOW.achievements)), linesForItems(p.achievements.length));
  add(section("Publications", () => publicationList(p, SHOW.publications)), linesForItems(p.publications.length));
  add(section("Registrations", () => registrationRows(p, SHOW.registrations)), linesForItems(p.registrations.length));
  return out;
}

/** The layered chrome (zone + raised plate) plus the body blocks that fit page 1. */
function renderFirst(p: CardProfile, fit: PageBlock[]): string {
  // The band carries the standing facts, never the name — that is the plate's job.
  const banner = joinParts(
    [p.totalYearsExperience ? `${p.totalYearsExperience} experience` : null, p.location],
    " · ",
  );

  const body = joinBlocks(fit.map((b) => b.html));

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
      </div>    </div>
    ${body ? `<main class="iv-ov-body">${body}</main>` : ""}
    ${
      site || socials
        ? `<footer class="iv-ov-foot">${site}${socials}</footer>`
        : ""
    }
  </div>`;
}

function build(p: CardProfile): string {
  return renderFirst(p, bodyBlocks(p));
}

function paged(p: CardProfile): PagedContent {
  return {
    firstPage: (fit) => renderFirst(p, fit),
    slim: nonEmpty(p.fullName) ? esc(p.fullName) : "",
    blocks: bodyBlocks(p),
    chromeWeight: 6, // banner + plate (name, role, contact)
  };
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

/* Continuation pages (2+) carry no zone or plate — just the overflow sections in
   a single column — so they need their own page padding. */
${s} .iv-page-cont{padding:.9em 1.05em}

@container (max-width:320px){
  ${s} .iv-ov-plate{margin-left:.65em;margin-right:.65em;padding:.7em .75em}
}
</style>`;
}

export const overlap = { build, styles, paged };
