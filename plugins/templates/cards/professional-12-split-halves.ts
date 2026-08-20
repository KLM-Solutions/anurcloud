/**
 * Professional template 12 — "Split Halves" · DYNAMIC A4 card (20 Aug 2026)
 *
 * Deliberately a DIFFERENT interaction from Skill Meters (which is a top header
 * over a scrolling section list). Here the 50/50 split IS the navigation and it
 * is persistent:
 *
 *   ┌───────────────┬───────────────┐
 *   │ CONTENT (left)│░ MENU (right) ░│
 *   │ selected      │░ Priya Menon  ░│
 *   │ section       │░ VP Eng · Zoho ░│
 *   │ shows here    │░ ───────────── ░│
 *   │               │░ ▸ Overview    ░│
 *   │               │░ ▸ Experience  ░│
 *   │               │░ ▸ Projects    ░│
 *   └───────────────┴───────────────┘
 *      white content    coloured menu
 *
 *   • RIGHT half (coloured — the signature "colour on the right") holds the
 *     identity and a vertical MENU of sections. Tapping a menu item swaps the
 *     LEFT half's content. The menu stays visible — no Back needed.
 *   • Small sections are grouped under "Overview" (shown in full, no dedicated
 *     item); big sections are their own menu items.
 *   • Missing field → no menu item. A4 frame (380x537 on screen); print stacks
 *     every section as real A4 pages. CSS-only, no JavaScript.
 *
 * Grayscale-distinct: a balanced 50/50 with a coloured RIGHT half is not Side
 * Rail (a narrow left rail) and not Skill Meters (a top header). Self-contained.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { esc, nonEmpty } from "../helpers";
import {
  bio,
  experienceHighlights,
  projectList,
  educationList,
  certificationList,
  achievementList,
  publicationList,
  registrationRows,
  chips,
  contactRows,
  socialIcons,
  websiteList,
} from "../sections";

type Kind = "long" | "list" | "chips";
interface Area {
  key: string;
  label: string;
  html: string;
  count: number;
  kind: Kind;
}

function area(key: string, label: string, full: string, count: number, kind: Kind): Area {
  return { key, label, html: (full ?? "").trim(), count: count ?? 0, kind };
}

/** Big section (>4) → its own menu item; small → grouped under Overview. */
function isBig(a: Area): boolean {
  if (a.kind === "long") return true;
  if (a.kind === "chips") return Math.ceil(a.count / 4) > 4;
  return a.count * 2 > 4;
}

function areasFor(p: CardProfile): Area[] {
  return [
    area("experience", "Experience", experienceHighlights(p), p.experience.length, "long"),
    area("projects", "Projects", projectList(p), p.projects.length, "list"),
    area("skills", "Skills", chips(p.skills), p.skills.length, "chips"),
    area("education", "Education", educationList(p), p.education.length, "list"),
    area("certs", "Certifications", certificationList(p), p.certifications.length, "list"),
    area("awards", "Awards", achievementList(p), p.achievements.length, "list"),
    area("papers", "Publications", publicationList(p), p.publications.length, "list"),
    area("registrations", "Registrations", registrationRows(p), p.registrations.length, "chips"),
    area("languages", "Languages", chips(p.languages), p.languages.length, "chips"),
    area("links", "Links", [websiteList(p), socialIcons(p.socialLinks)].filter(Boolean).join(""), p.websites.length + p.socialLinks.length, "chips"),
    area("contact", "Contact", contactRows(p), [p.email, p.phone, p.location].filter(Boolean).length, "chips"),
  ].filter((a) => a.html.length > 0);
}

function build(p: CardProfile, theme: ResolvedTheme): string {
  const scope = theme.scopeId;
  const areas = areasFor(p);
  const big = areas.filter(isBig);
  const small = areas.filter((a) => !isBig(a));

  // One radio per left-panel: Overview (default) + each big section.
  const radios = [
    `<input class="iv-r" type="radio" name="${scope}-nav" id="${scope}-overview" checked>`,
    ...big.map((a) => `<input class="iv-r" type="radio" name="${scope}-nav" id="${scope}-${a.key}">`),
  ].join("");

  // LEFT content panels. Each wraps its content in a scroller with a scroll cue
  // (⌄ scroll → ⌃ scroll up) so a long section reads clearly in the narrow half.
  const panel = (view: string, inner: string) =>
    `<div class="iv-hl-panel" data-view="${view}">
      <div class="iv-hl-pscroll">${inner}</div>
      <div class="iv-hl-fade" aria-hidden="true"></div>
      <div class="iv-hl-more" aria-hidden="true">⌄ scroll</div>
      <div class="iv-hl-up" aria-hidden="true">⌃ scroll up</div>
    </div>`;

  const overviewPanel = panel(
    "overview",
    `${bio(p) ? `<div class="iv-hl-about">${bio(p)}</div>` : ""}${small
      .map((a) => `<div class="iv-hl-sec"><div class="iv-hl-h">${esc(a.label)}</div>${a.html}</div>`)
      .join("")}`,
  );
  const bigPanels = big
    .map((a) => panel(a.key, `<div class="iv-hl-h iv-hl-h-top">${esc(a.label)}</div>${a.html}`))
    .join("");

  // RIGHT coloured menu: identity + section buttons.
  const menuItems = [{ key: "overview", label: "Overview" }, ...big.map((a) => ({ key: a.key, label: a.label }))]
    .map((m) => `<label class="iv-hl-item" for="${scope}-${m.key}"><span class="iv-hl-dot" aria-hidden="true">▸</span>${esc(m.label)}</label>`)
    .join("");

  const menu = `<aside class="iv-hl-menu">
    <div class="iv-hl-id">
      ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
      ${nonEmpty(p.designation) || nonEmpty(p.currentCompany) ? `<div class="iv-role">${esc([p.designation, p.currentCompany].filter(nonEmpty).join(" · "))}</div>` : ""}
      ${p.totalYearsExperience ? `<div class="iv-hl-yrs">${esc(p.totalYearsExperience)} experience</div>` : ""}
    </div>
    <nav class="iv-hl-nav">${menuItems}</nav>
  </aside>`;

  // Active-item highlight + which left panel shows, per selected radio.
  const rules = [{ key: "overview" }, ...big.map((a) => ({ key: a.key }))]
    .map(
      (m) =>
        `#${scope}-${m.key}:checked ~ .iv-hl-wrap [data-view="${m.key}"]{display:block}` +
        `#${scope}-${m.key}:checked ~ .iv-hl-wrap [for="${scope}-${m.key}"]{background:var(--iv-onp);color:var(--iv-primary)}`,
    )
    .join("");

  return `${radios}<style>${rules}</style><div class="iv-hl-wrap"><main class="iv-hl-content">${overviewPanel}${bigPanels}</main>${menu}</div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
/* A4 portrait frame. 380x537 on screen; real A4 on print. */
${s}.iv-split-halves{position:relative;height:537px;background:var(--iv-surface)}
${s} .iv-r{position:absolute;opacity:0;pointer-events:none}

/* The persistent 50/50 split: white content on the LEFT, coloured menu on the
   RIGHT (the signature). 1fr 1fr is the balance that tells it apart from a rail.
   (No backticks in this block — it is inside a template literal.) */
${s} .iv-hl-wrap{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr}

/* LEFT — content. Only the selected panel shows; its scroller has a scroll cue. */
${s} .iv-hl-content{position:relative;min-width:0;overflow:hidden}
${s} .iv-hl-panel{position:absolute;inset:0;display:none;timeline-scope:--ivsc}
${s} .iv-hl-pscroll{position:absolute;inset:0;overflow-y:auto;padding:1.1em 1em 2.6em;scrollbar-width:thin;scroll-timeline:--ivsc block}
${s} .iv-hl-panel .iv-sec-h{display:none}
${s} .iv-hl-about .iv-bio{margin:0 0 1em}

/* Scroll cue in the left panel: "scroll" at the top, "scroll up" at the bottom. */
${s} .iv-hl-fade{position:absolute;left:0;right:0;bottom:0;height:2.6em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-hl-more,${s} .iv-hl-up{position:absolute;left:50%;bottom:.4em;transform:translateX(-50%);font-size:.58em;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}
${s} .iv-hl-up{opacity:0}
@supports (animation-timeline:scroll()){
  ${s} .iv-hl-more{animation:iv-fout both;animation-timeline:--ivsc;animation-range:75% 96%}
  ${s} .iv-hl-up{animation:iv-fin both;animation-timeline:--ivsc;animation-range:75% 96%}
}
@keyframes iv-fout{to{opacity:0}}
@keyframes iv-fin{to{opacity:1}}
${s} .iv-hl-sec+.iv-hl-sec{margin-top:1em}
${s} .iv-hl-h{font-family:var(--iv-font-h);font-weight:700;font-size:.62em;letter-spacing:.09em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}
${s} .iv-hl-h-top{margin-top:0}
${s} .iv-hl-content .iv-item-t{font-size:.82em}
${s} .iv-hl-content .iv-item-m{font-size:.72em}

/* RIGHT — the coloured menu with identity on top. */
${s} .iv-hl-menu{background:var(--iv-grad);color:var(--iv-onp);padding:1.2em .9em;min-width:0;display:flex;flex-direction:column;gap:1em;overflow-y:auto}
${s} .iv-hl-id .iv-name{color:var(--iv-onp);font-size:1.1em;line-height:1.15}
${s} .iv-hl-id .iv-role{color:color-mix(in srgb,var(--iv-onp) 85%,transparent);font-size:.74em;margin-top:.2em}
${s} .iv-hl-yrs{color:color-mix(in srgb,var(--iv-onp) 78%,transparent);font-size:.68em;margin-top:.25em}
${s} .iv-hl-nav{display:flex;flex-direction:column;gap:.3em}
${s} .iv-hl-item{display:flex;align-items:center;gap:.4em;padding:.5em .6em;border-radius:.5em;font-size:.78em;font-weight:700;color:var(--iv-onp);cursor:pointer;user-select:none;transition:background .12s}
${s} .iv-hl-item:hover{background:color-mix(in srgb,var(--iv-onp) 16%,transparent)}
${s} .iv-hl-dot{opacity:.7}

/* Narrow host: the split unwinds to menu on top, content below. */
@container (max-width:300px){
  ${s} .iv-hl-wrap{grid-template-columns:1fr;grid-template-rows:auto 1fr}
  ${s} .iv-hl-menu{order:-1;flex-direction:column}
}

/* PRINT: one flowing document, every section stacked as A4 pages, menu hidden. */
@media print{
  @page{size:A4;margin:14mm}
  ${s}.iv-split-halves{height:auto;position:static}
  ${s} .iv-r{display:none}
  ${s} .iv-hl-wrap{position:static;display:block}
  ${s} .iv-hl-content{position:static;overflow:visible}
  ${s} .iv-hl-panel{position:static;display:block!important;margin-bottom:1.2em}
  ${s} .iv-hl-pscroll{position:static;overflow:visible;padding:0}
  ${s} .iv-hl-panel .iv-sec-h,${s} .iv-hl-h{display:block}
  ${s} .iv-hl-menu,${s} .iv-hl-fade,${s} .iv-hl-more,${s} .iv-hl-up{display:none}
}
</style>`;
}

export const splitHalves = { build, styles };
