/**
 * Professional template 11 — "Skill Meters" · DYNAMIC A4 card (20 Aug 2026)
 *
 * The FIRST template converted to the dynamic model (owner's call, one at a time).
 * The card is a set of A4-portrait SCREENS you navigate between — CSS-only, no JS:
 *
 *   • Overview screen: identity + bio + the skill-meters CHART (the signature),
 *     then the content. A SMALL section is shown in FULL right here (no navigation
 *     — a near-empty extra screen is worse than just showing it). A BIG section
 *     shows a sample + a "view all" link that opens its own screen.
 *   • Section screen: the full section, with a Back link. One A4 screen each.
 *
 * A missing field shows nothing. Every screen is a fixed A4 portrait frame
 * (210:297 → 380x537 on screen); on PRINT each screen becomes one real A4 page
 * (everything shown, nav hidden) — the flatten-to-PDF path.
 *
 * Scroll cue: the home screen shows a "scroll" hint that flips to "scroll up"
 * once you reach the bottom (CSS scroll-driven, degrades to the down hint).
 *
 * Self-contained: imports only from within templates/. The chart reuses
 * measuredSkills — bars count how often a skill appears in the person's own role
 * highlights (evidence), captioned as such, NEVER a proficiency rating.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { measuredSkills } from "../guards";
import { esc } from "../helpers";
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

const one = <T>(arr: T[]): T[] => (arr && arr.length ? [arr[0]!] : []);

/* ── the signature chart (reuses measuredSkills — evidence, not proficiency) ── */
function chart(p: CardProfile): string {
  const rows = measuredSkills(p, 6);
  if (!rows.length) return "";
  const top = Math.max(...rows.map((r) => r.count));
  const bars = rows
    .map((r) => {
      const pct = Math.max(8, Math.round((r.count / top) * 100));
      return `<div class="iv-sm-row"><div class="iv-sm-k">${esc(r.skill)}</div><div class="iv-sm-track"><div class="iv-sm-fill" style="width:${pct}%"></div></div><div class="iv-sm-n">${esc(String(r.count))}</div></div>`;
    })
    .join("");
  return `<div class="iv-sm-chart">${bars}<p class="iv-sm-cap">Bars count how often each skill appears in the role highlights — not a proficiency rating.</p></div>`;
}

/* ── content areas ──────────────────────────────────────────────────────────── */
type Kind = "long" | "list" | "chips";
interface Area {
  key: string;
  label: string;
  html: string;
  sample: string;
  count: number;
  kind: Kind;
}

function area(key: string, label: string, full: string, sample: string, count: number, kind: Kind): Area {
  return { key, label, html: (full ?? "").trim(), sample: (sample ?? "").trim(), count: count ?? 0, kind };
}

/** Rough size of an area. A BIG area (>4) gets its own screen; small shows inline. */
function isBig(a: Area): boolean {
  if (a.kind === "long") return true;
  if (a.kind === "chips") return Math.ceil(a.count / 4) > 4;
  return a.count * 2 > 4; // list: 3+ items → its own screen
}

function areasFor(p: CardProfile): Area[] {
  return [
    area("experience", "Experience", experienceHighlights(p), experienceHighlights({ ...p, experience: one(p.experience) }), p.experience.length, "long"),
    area("projects", "Projects", projectList(p), projectList({ ...p, projects: one(p.projects) }), p.projects.length, "list"),
    area("skills", "Skills", chips(p.skills), chips(p.skills.slice(0, 5)), p.skills.length, "chips"),
    area("education", "Education", educationList(p), educationList({ ...p, education: one(p.education) }), p.education.length, "list"),
    area("certs", "Certifications", certificationList(p), certificationList({ ...p, certifications: one(p.certifications) }), p.certifications.length, "list"),
    area("awards", "Awards", achievementList(p), achievementList({ ...p, achievements: one(p.achievements) }), p.achievements.length, "list"),
    area("papers", "Publications", publicationList(p), publicationList({ ...p, publications: one(p.publications) }), p.publications.length, "list"),
    area("registrations", "Registrations", registrationRows(p), registrationRows({ ...p, registrations: one(p.registrations) }), p.registrations.length, "chips"),
    area("languages", "Languages", chips(p.languages), chips(p.languages), p.languages.length, "chips"),
    area("links", "Links", [websiteList(p), socialIcons(p.socialLinks)].filter(Boolean).join(""), "", p.websites.length + p.socialLinks.length, "chips"),
    area("contact", "Contact", contactRows(p), "", [p.email, p.phone, p.location].filter(Boolean).length, "chips"),
  ].filter((a) => a.html.length > 0);
}

/* ── build ──────────────────────────────────────────────────────────────────── */
function build(p: CardProfile, theme: ResolvedTheme): string {
  const scope = theme.scopeId;
  const areas = areasFor(p);
  const big = areas.filter(isBig); // each → its own screen

  const radios = [
    `<input class="iv-r" type="radio" name="${scope}-nav" id="${scope}-overview" checked>`,
    ...big.map((a) => `<input class="iv-r" type="radio" name="${scope}-nav" id="${scope}-${a.key}">`),
  ].join("");

  // Overview content, in order: big → sample + "view all" link; small → shown in full.
  const blocks = areas
    .map((a) => {
      if (isBig(a)) {
        const nav = a.count > 1 ? `View all ${a.count}` : "Open";
        return `<label class="iv-ovsec" for="${scope}-${a.key}"><div class="iv-ovh">${esc(a.label)}</div><div class="iv-ovs">${a.sample}</div><div class="iv-ovnav">${nav} <span aria-hidden="true">›</span></div></label>`;
      }
      return `<div class="iv-ovinline"><div class="iv-ovh">${esc(a.label)}</div>${a.html}</div>`;
    })
    .join("");

  const header = `<header class="iv-sm-head">
    <div class="iv-name">${p.fullName ? esc(p.fullName) : ""}</div>
    <div class="iv-role">${esc([p.designation, p.currentCompany].filter(Boolean).join(" · "))}</div>
    ${p.totalYearsExperience ? `<div class="iv-sm-yrs">${esc(p.totalYearsExperience)} of experience</div>` : ""}
  </header>`;

  const overview = `<div class="iv-view iv-overview">
    ${header}
    <div class="iv-ovwrap">
      <div class="iv-ovscroll">${bio(p) ? `<div class="iv-sm-about">${bio(p)}</div>` : ""}${chart(p)}<div class="iv-secs">${blocks}</div></div>
      <div class="iv-ovfade" aria-hidden="true"></div>
      <div class="iv-ovmore" aria-hidden="true">⌄ scroll</div>
      <div class="iv-ovup" aria-hidden="true">⌃ scroll up</div>
    </div>
  </div>`;

  const views = big
    .map(
      (a) => `<div class="iv-view iv-page" data-view="${a.key}">
      <div class="iv-bar"><label class="iv-back" for="${scope}-overview"><span aria-hidden="true">‹</span> Back</label><span class="iv-ptitle">${esc(a.label)}</span></div>
      <div class="iv-pbody">${a.html}</div>
    </div>`,
    )
    .join("");

  // Per-screen show rules need the scope + this profile's section keys.
  const show =
    `#${scope}-overview:checked ~ .iv-stage .iv-overview{display:flex}` +
    big.map((a) => `#${scope}-${a.key}:checked ~ .iv-stage [data-view="${a.key}"]{display:flex}`).join("");

  return `${radios}<style>${show}</style><div class="iv-stage">${overview}${views}</div>`;
}

/* ── styles (generic; profile-independent) ──────────────────────────────────── */
function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
/* A4 portrait frame (210:297). 380x537 on screen; real A4 on print. */
${s}.iv-skill-meters{position:relative;height:537px;background:var(--iv-surface)}
${s} .iv-r{position:absolute;opacity:0;pointer-events:none}
${s} .iv-stage{position:absolute;inset:0}
${s} .iv-view{position:absolute;inset:0;display:none;flex-direction:column}

/* Overview: identity header, then a scroll area with bio + chart + content. */
${s} .iv-sm-head{padding:1.1em 1.2em;border-bottom:1px solid var(--iv-edge);flex:0 0 auto}
${s} .iv-sm-head .iv-name{font-size:1.25em}
${s} .iv-sm-head .iv-role{font-size:.82em;color:var(--iv-muted);margin-top:.15em}
${s} .iv-sm-yrs{font-size:.72em;color:var(--iv-muted);margin-top:.2em}

${s} .iv-ovwrap{position:relative;flex:1 1 auto;min-height:0;timeline-scope:--ivsc}
${s} .iv-ovscroll{position:absolute;inset:0;overflow-y:auto;padding:1.1em 1.2em 2.8em;scrollbar-width:thin;scroll-timeline:--ivsc block}
${s} .iv-sm-about .iv-bio{margin:0 0 1em}
${s} .iv-ovfade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}

/* Scroll cues: "scroll" at the top, crossfading to "scroll up" at the bottom.
   Default (no scroll-driven-animation support) keeps the down cue visible. */
${s} .iv-ovmore,${s} .iv-ovup{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}
${s} .iv-ovup{opacity:0}
@supports (animation-timeline:scroll()){
  ${s} .iv-ovmore{animation:iv-fout both;animation-timeline:--ivsc;animation-range:75% 96%}
  ${s} .iv-ovup{animation:iv-fin both;animation-timeline:--ivsc;animation-range:75% 96%}
}
@keyframes iv-fout{to{opacity:0}}
@keyframes iv-fin{to{opacity:1}}

/* The chart. */
${s} .iv-sm-row{display:grid;grid-template-columns:6em 1fr 1.2em;align-items:center;gap:.5em}
${s} .iv-sm-row+.iv-sm-row{margin-top:.42em}
${s} .iv-sm-k{font-size:.72em;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
${s} .iv-sm-track{height:.5em;border-radius:999px;background:color-mix(in srgb,var(--iv-muted) 16%,transparent);overflow:hidden}
${s} .iv-sm-fill{height:100%;border-radius:999px;background:var(--iv-grad)}
${s} .iv-sm-n{font-family:var(--iv-font-h);font-size:.64em;font-weight:700;color:var(--iv-muted);text-align:right}
${s} .iv-sm-cap{margin-top:.6em;font-size:.6em;line-height:1.5;color:var(--iv-muted)}

/* Overview content blocks: inline (shown in full) and link (sample + view all). */
${s} .iv-secs{display:flex;flex-direction:column;margin-top:1em}
${s} .iv-ovsec,${s} .iv-ovinline{display:block;padding:.85em 0;border-top:1px solid var(--iv-edge)}
${s} .iv-ovsec{cursor:pointer;user-select:none}
${s} .iv-ovsec:hover .iv-ovnav{color:var(--iv-primary)}
${s} .iv-ovh{font-family:var(--iv-font-h);font-weight:700;font-size:.66em;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}
${s} .iv-ovs .iv-sec-h{display:none}
${s} .iv-ovnav{margin-top:.5em;font-size:.72em;font-weight:700;color:var(--iv-muted)}

/* Section screen. */
${s} .iv-bar{display:flex;align-items:center;gap:.6em;padding:.85em 1em;border-bottom:1px solid var(--iv-edge);flex:0 0 auto}
${s} .iv-back{display:inline-flex;align-items:center;gap:.15em;font-size:.78em;font-weight:700;color:var(--iv-primary);cursor:pointer;user-select:none}
${s} .iv-back span{font-size:1.3em;line-height:1}
${s} .iv-ptitle{font-family:var(--iv-font-h);font-weight:700;font-size:.9em}
${s} .iv-pbody{flex:1 1 auto;overflow-y:auto;padding:1.2em}
${s} .iv-pbody .iv-sec-h{display:none}

/* PRINT: real A4 pages, one per screen, all sections shown, nav hidden. */
@media print{
  @page{size:A4;margin:14mm}
  ${s}.iv-skill-meters{height:auto;position:static}
  ${s} .iv-r{display:none}
  ${s} .iv-stage{position:static}
  ${s} .iv-view{position:static;display:flex!important;break-after:page;height:auto}
  ${s} .iv-ovwrap,${s} .iv-ovscroll,${s} .iv-pbody{position:static;overflow:visible}
  ${s} .iv-back,${s} .iv-ovfade,${s} .iv-ovmore,${s} .iv-ovup{display:none!important}
  ${s} .iv-ovsec .iv-ovnav{display:none}
}
</style>`;
}

export const skillMeters = { build, styles };
