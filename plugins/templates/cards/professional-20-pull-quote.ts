import type { CardProfile } from "../types";
import { SHOW } from "../limits";
import { esc, nonEmpty } from "../helpers";
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
  experienceYears,
  projectList,
  publicationList,
  registrationRows,
  socialIcons,
  websiteLine,
} from "../sections";

/** The bio as the display quote — full text, no truncation (owner decision, 20 Aug 2026). */
function quote(p: CardProfile): string {
  return nonEmpty(p.bio) ? esc(p.bio.trim()) : "";
}

/**
 * The body sections beneath the quote, in order — the ONE list both render paths
 * use. The quote hero (the card's whole identity) is chrome and stays on page 1;
 * only these flow onto continuation pages.
 */
function bodyBlocks(p: CardProfile): PageBlock[] {
  const out: PageBlock[] = [];
  const add = (html: string, weight: number) => {
    if (html.trim()) out.push({ html, weight });
  };
  const exp = experienceGroup(p, SHOW.roles, SHOW.highlightsPerRole);
  if (exp) out.push(exp);
  add(section("Skills", () => chips(p.skills, SHOW.skills)), Math.ceil(p.skills.length / 3) + 1);
  add(section("Projects", () => projectList(p, SHOW.projects)), linesForItems(p.projects.length, 3));
  add(section("Certifications", () => certificationList(p, SHOW.certifications)), linesForItems(p.certifications.length));
  add(section("Education", () => educationList(p, SHOW.education)), linesForItems(p.education.length));
  add(section("Languages", () => chips(p.languages, SHOW.languages)), Math.ceil(p.languages.length / 4) + 1);
  add(section("Awards", () => achievementList(p, SHOW.achievements)), linesForItems(p.achievements.length));
  add(section("Publications", () => publicationList(p, SHOW.publications)), linesForItems(p.publications.length));
  add(section("Registrations", () => registrationRows(p, SHOW.registrations)), linesForItems(p.registrations.length));
  return out;
}

/** Page 1: the display quote + attribution, then the body sections that fit. */
function renderFirst(p: CardProfile, fit: PageBlock[]): string {
  const body = joinBlocks(fit.map((b) => b.html));

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
          ${experienceYears(p)}
        </div>      </figcaption>
    </figure>
    ${body ? `<main class="iv-pq-body">${body}</main>` : ""}
    ${
      site || socials
        ? `<footer class="iv-pq-foot">${site}${socials}</footer>`
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
    // The quote is display type, so it is taller than a line of body text — weight
    // it at ~30 chars/line, plus the attribution caption.
    chromeWeight: linesForText(p.bio, 30) + 4,
  };
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

/* Continuation pages (2+) carry no quote — just the overflow sections in a single
   column — so they need their own page padding to match the wrap inset. */
${s} .iv-page-cont{padding:1.1em 1.2em}

/* Display type at a narrow measure turns into three words a line, so it steps
   down rather than shredding the quote. */
@container (max-width:320px){
  ${s} .iv-pq-wrap{padding:1.1em 1em 1em}
  ${s} .iv-pq-q{font-size:1.12em}
  ${s} .iv-pq-mark{font-size:2.5em}
}
</style>`;
}

export const pullQuote = { build, styles, paged };
