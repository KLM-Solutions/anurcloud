/**
 * Professional template 17 — "Role Ladder" (DEV-3052)
 *
 *   ┌───────────────────────┐
 *   │ Priya Menon   (logo)  │
 *   │ VP Engineering        │
 *   │ ▌ VP Engineering      │
 *   │ ▌ Zoho · 2022–present │
 *   │   ▌ Engineering Lead  │
 *   │   ▌ Freshworks · '19  │
 *   │     ▌ Senior Engineer │
 *   │     ▌ Zoho · 2016–'19 │
 *   └───────────────────────┘
 *
 * Structurally: a descending stair. Each role is its own rung with its own short
 * bar, and every rung further down the card is indented one step further, so
 * career progression is read from the *shape* before a word is read.
 *
 * ── Not the Timeline card ─────────────────────────────────────────────────
 * Timeline (student 4) is one continuous spine with dots, every entry flush to
 * the same left edge, mixing education, internships and projects. This is roles
 * only, has no spine and no dots, and its defining feature is that the entries
 * are NOT aligned with each other. In grayscale the two are not confusable: one
 * is a straight line of beads, the other is a staircase.
 *
 * ── Why the indent is CSS, not inline ─────────────────────────────────────
 * The steps come from nth-child rules rather than a computed style attribute.
 * Theme values are validated before they reach a card, but profile-derived
 * numbers in a style attribute are exactly the pattern that turns into an
 * injection the day someone forgets the validator. There is nothing to forget
 * if the card never writes one.
 *
 * Thin data: unreachable — this card is only offered with two roles or more.
 * Minimum: 2 roles.
 */

import type { CardProfile } from "../types";
import { SHOW } from "../limits";
import { esc, joinParts, nonEmpty } from "../helpers";
import { meaningfulExperience, section } from "../guards";
import { groupBlock, linesForItems, type PageBlock, type PagedContent } from "../pagination";
import {
  achievementList,
  bio,
  certificationList,
  chips,
  contactInline,
  educationList,
  experienceYears,
  nameBlock,
  projectList,
  publicationList,
  registrationRows,
  socialIcons,
  websiteList,
} from "../sections";

/**
 * One rung per role, as a page block so a long career flows across pages instead
 * of one giant page. The staircase depth is baked into each rung's class
 * (`iv-rl-d0..3`) rather than read from its position, so the indent survives a
 * page break (a role keeps its step whichever page it lands on). Depth caps at 3
 * so deep rungs don't march off the card.
 */
function rungItems(p: CardProfile): PageBlock[] {
  return p.experience
    .filter(meaningfulExperience)
    .map((e, i) => {
      const meta = joinParts([e.company, e.duration, e.location]);
      const points = (e.highlights ?? []).filter(nonEmpty);
      const bullet = points.length
        ? `<ul class="iv-hl">${points.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
        : "";
      const html = `<div class="iv-rl-rung iv-rl-d${Math.min(i, 3)}">
        ${nonEmpty(e.role) ? `<div class="iv-item-t">${esc(e.role)}</div>` : ""}
        ${meta ? `<div class="iv-item-m">${esc(meta)}</div>` : ""}
        ${bullet}
      </div>`;
      const weight = 2 + points.reduce((n, h) => n + Math.max(1, Math.ceil(h.length / 33)), 0);
      return { html, weight };
    });
}

/** The identity head + contact — the card's chrome, on page 1. */
function chrome(p: CardProfile): string {
  const contact = contactInline(p);
  return `<header class="iv-rl-head">
      <div class="iv-rl-head-txt">${nameBlock(p)}${experienceYears(p)}${bio(p)}</div>    </header>
    ${contact ? `<div class="iv-rl-contact">${contact}</div>` : ""}`;
}

/**
 * The tail sections, in order — the single list both render paths consume. Each
 * block carries an estimated weight in "lines" for pagination.
 */
function contentBlocks(p: CardProfile): PageBlock[] {
  const out: PageBlock[] = [];
  const add = (html: string, weight: number) => {
    if (html.trim()) out.push({ html, weight });
  };
  // The staircase leads, as a splittable group so a long career flows across
  // pages instead of forming one giant page.
  const ladder = groupBlock("", "", rungItems(p));
  if (ladder) out.push(ladder);
  add(section("Education", () => educationList(p, SHOW.education)), linesForItems(p.education.length));
  add(section("Projects", () => projectList(p, SHOW.projects)), linesForItems(p.projects.length, 3));
  add(section("Skills", () => chips(p.skills, SHOW.skills)), Math.ceil(p.skills.length / 3) + 1);
  add(section("Certifications", () => certificationList(p, SHOW.certifications)), linesForItems(p.certifications.length));
  add(section("Awards", () => achievementList(p, SHOW.achievements)), linesForItems(p.achievements.length));
  add(section("Publications", () => publicationList(p, SHOW.publications)), linesForItems(p.publications.length));
  add(section("Registrations", () => registrationRows(p, SHOW.registrations)), linesForItems(p.registrations.length));
  add(section("Languages", () => chips(p.languages, SHOW.languages)), Math.ceil(p.languages.length / 4) + 1);
  add(section("Portfolio", () => websiteList(p, SHOW.websites)), linesForItems(p.websites.length, 1));
  const socials = socialIcons(p.socialLinks, SHOW.socials);
  add(socials ? `<div class="iv-rl-social">${socials}</div>` : "", 2);
  return out;
}

function build(p: CardProfile): string {
  const body = contentBlocks(p)
    .map((b) => b.html)
    .join("");
  // Same shape the paginated path produces (chrome + blocks in an .iv-page), so
  // the padding lives on .iv-page and applies on both paths.
  return `<div class="iv-page">${chrome(p)}${body}</div>`;
}

function paged(p: CardProfile): PagedContent {
  return {
    chrome: chrome(p),
    slim: nameBlock(p),
    blocks: contentBlocks(p),
    chromeWeight: 5, // head + bio + contact
  };
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
/* No colour block anywhere on this card. The brand colour appears only in the
   rung bars, which is what keeps the staircase the loudest thing on it. */
${s}.iv-role-ladder{background:var(--iv-surface)}
/* Padding on the page (not an inner wrapper) so it applies on the paginated path
   too — the chrome + rungs are direct children of .iv-page, and without this the
   name touched and clipped at the card's left edge. */
${s} .iv-page{padding:1.15em 1.1em}

${s} .iv-rl-head{display:flex;align-items:flex-start;gap:.6em}
${s} .iv-rl-head-txt{min-width:0;flex:1 1 auto}
${s} .iv-rl-contact{margin-top:.4em}

/* Each rung carries its own bar. A single continuous spine would make this the
   Timeline card with the dots removed. */
${s} .iv-rl-rung{position:relative;padding:.15em 0 .15em .8em;border-left:.2em solid var(--iv-primary)}
${s} .iv-rl-rung+.iv-rl-rung{margin-top:.55em}
/* The first rung leads the ladder below the chrome / a continuation page. */
${s} .iv-rl-contact+.iv-rl-rung,${s} .iv-rl-head+.iv-rl-rung{margin-top:.9em}
${s} .iv-page-cont .iv-rl-rung:first-of-type{margin-top:0}

/* The staircase. Depth is baked into the rung class (iv-rl-d0..3) so the indent
   survives a page break, and the bar fades with depth so the most recent role
   reads as the strongest without a label. */
${s} .iv-rl-d1{margin-left:.95em;border-left-color:color-mix(in srgb,var(--iv-primary) 78%,var(--iv-surface))}
${s} .iv-rl-d2{margin-left:1.9em;border-left-color:color-mix(in srgb,var(--iv-primary) 56%,var(--iv-surface))}
${s} .iv-rl-d3{margin-left:2.85em;border-left-color:color-mix(in srgb,var(--iv-primary) 38%,var(--iv-surface))}

/* Tail sections sit below the ladder, separated by a rule on the first one. */
${s} .iv-rl-rung+.iv-sec-h{margin-top:1em;padding-top:.9em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 20%,transparent)}
${s} .iv-rl-social{margin-top:.8em}

/* A narrow card cannot afford three indents plus a role title, so the staircase
   tightens rather than letting titles wrap to two lines each. */
@container (max-width:320px){
  ${s} .iv-rl-d1{margin-left:.55em}
  ${s} .iv-rl-d2{margin-left:1.1em}
  ${s} .iv-rl-d3{margin-left:1.65em}
}
</style>`;
}

export const roleLadder = { build, styles, paged };
