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
  contactRows,
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
 * The sheet's content sections, in order — the ONE list both render paths use.
 * The tab (identity) is chrome and stays on page 1; these flow onto continuation
 * pages when a career runs long.
 */
function bodyBlocks(p: CardProfile): PageBlock[] {
  const out: PageBlock[] = [];
  const add = (html: string, weight: number) => {
    if (html.trim()) out.push({ html, weight });
  };
  add(experienceYears(p), 1);
  add(section("Profile", () => bio(p, SHOW.bioChars)), linesForText(p.bio));
  const exp = experienceGroup(p, SHOW.roles, SHOW.highlightsPerRole);
  if (exp) out.push(exp);
  add(section("Projects", () => projectList(p, SHOW.projects)), linesForItems(p.projects.length, 3));
  add(section("Skills", () => chips(p.skills, SHOW.skills)), Math.ceil(p.skills.length / 3) + 1);
  add(section("Certifications", () => certificationList(p, SHOW.certifications)), linesForItems(p.certifications.length));
  add(section("Education", () => educationList(p, SHOW.education)), linesForItems(p.education.length));
  add(section("Languages", () => chips(p.languages, SHOW.languages)), Math.ceil(p.languages.length / 4) + 1);
  add(section("Contact", () => contactRows(p)), 3);
  add(section("Awards", () => achievementList(p, SHOW.achievements)), linesForItems(p.achievements.length));
  add(section("Publications", () => publicationList(p, SHOW.publications)), linesForItems(p.publications.length));
  add(section("Registrations", () => registrationRows(p, SHOW.registrations)), linesForItems(p.registrations.length));
  return out;
}

/** Page 1: the folder tab + rule, then the body sections that fit beneath it. */
function renderFirst(p: CardProfile, fit: PageBlock[]): string {
  const body = joinBlocks(fit.map((b) => b.html));

  const site = websiteLine(p);
  const socials = socialIcons(p.socialLinks, SHOW.socials);

  return `<div class="iv-ft-wrap">
    <div class="iv-ft-head">
      <div class="iv-ft-tab">
        ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
        ${
          nonEmpty(p.designation) || nonEmpty(p.currentCompany)
            ? `<div class="iv-role">${esc(
                [p.designation, p.currentCompany].filter(nonEmpty).join(" · "),
              )}</div>`
            : ""
        }      </div>
    </div>
    ${body ? `<main class="iv-ft-body">${body}</main>` : ""}
    ${
      site || socials
        ? `<footer class="iv-ft-foot">${site}${socials}</footer>`
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
    chromeWeight: 3, // tab: name + role
  };
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-folder-tab{background:var(--iv-surface)}

/* The head is the rule; the tab sits on top of it and stops short of the right
   edge. Together they make the asymmetric top the card is named for.
   (No backticks in this block — it is inside a template literal.) */
${s} .iv-ft-head{border-bottom:.28em solid var(--iv-primary);line-height:0}

/* inline-block so the tab is as wide as its content and no wider, capped so it
   always leaves page visible to its right. The right corner is rounded and the
   left one follows the card, which is what reads as a tab rather than a band. */
${s} .iv-ft-tab{display:inline-block;line-height:1.45;max-width:80%;min-width:45%;background:var(--iv-grad);color:var(--iv-onp);padding:.85em 1.1em .75em;border-radius:max(0px, calc(var(--iv-radius) - 2px)) .85em 0 0}
${s} .iv-ft-tab .iv-name{font-size:1.12em;color:var(--iv-onp)}
/* The muted token is tuned for a light surface; on the tab it would vanish. */
${s} .iv-ft-tab .iv-role{color:color-mix(in srgb,var(--iv-onp) 80%,transparent)}

${s} .iv-ft-body{padding:.7em 1.1em 0}
${s} .iv-ft-body .iv-sec-h:first-child{margin-top:.7em}

${s} .iv-ft-foot{padding:.9em 1.1em 1.05em;display:flex;align-items:center;justify-content:space-between;gap:.5em;flex-wrap:wrap}
${s} .iv-ft-foot .iv-cinline{color:var(--iv-primary)}

/* Continuation pages (2+) carry no tab — just the overflow sections — so they
   need their own page padding to match the body inset. */
${s} .iv-page-cont{padding:.7em 1.1em 1.05em}

/* On a narrow card an 80% cap leaves a sliver of page, which reads as a mistake
   rather than as a tab. Widen the tab and let the rule do more of the work. */
@container (max-width:320px){
  ${s} .iv-ft-tab{max-width:88%;padding:.75em .9em .65em}
}
</style>`;
}

export const folderTab = { build, styles, paged };
