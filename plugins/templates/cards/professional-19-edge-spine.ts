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


/**
 * The body sections, in order — the ONE list both render paths use. The vertical
 * spine (the name) is chrome that stays on page 1; only these flow onto
 * continuation pages, so the name is never repeated below page 1.
 */
function bodyBlocks(p: CardProfile): PageBlock[] {
  const out: PageBlock[] = [];
  const add = (html: string, weight: number) => {
    if (html.trim()) out.push({ html, weight });
  };
  add(section("Profile", () => bio(p, SHOW.bioChars)), linesForText(p.bio));
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

/** Page 1: the body (header + fitting sections) beside the vertical name spine. */
function renderFirst(p: CardProfile, fit: PageBlock[]): string {
  const body = joinBlocks(fit.map((b) => b.html));

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
          ${experienceYears(p)}
        </div>      </header>
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

function build(p: CardProfile): string {
  return renderFirst(p, bodyBlocks(p));
}

function paged(p: CardProfile): PagedContent {
  return {
    firstPage: (fit) => renderFirst(p, fit),
    // NOT the name: the name lives only on the spine (page 1), and repeating it in
    // a continuation header would both duplicate it and defeat the layout.
    slim:
      nonEmpty(p.designation) || nonEmpty(p.currentCompany)
        ? esc([p.designation, p.currentCompany].filter(nonEmpty).join(" · "))
        : "",
    blocks: bodyBlocks(p),
    chromeWeight: 4, // role + contact + years
  };
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

/* Continuation pages (2+) carry no spine — just the overflow sections in a single
   column — so they need their own page padding. */
${s} .iv-page-cont{padding:1.15em 1.1em 1.05em}

/* A narrow card cannot spare 5.5em for a strip and still hold a line of text. */
@container (max-width:320px){
  ${s} .iv-es-spine{max-width:3.6em;padding:.85em .45em}
  ${s} .iv-es-name{font-size:.95em}
}
</style>`;
}

export const edgeSpine = { build, styles, paged };
