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
import { meaningfulExperience, joinBlocks, section } from "../guards";
import {
  achievementList,
  bio,
  certificationList,
  chips,
  contactInline,
  nameBlock,
  publicationList,
  registrationRows,
  socialIcons,
} from "../sections";

/** Four rungs is the deepest the indent can go before the last one is a sliver. */
const MAX_RUNGS = 4;

function rungs(p: CardProfile): string {
  return p.experience
    .filter(meaningfulExperience)
    .slice(0, MAX_RUNGS)
    .map((e) => {
      const meta = joinParts([e.company, e.duration, e.location]);
      const points = (e.highlights ?? []).filter(nonEmpty).slice(0, 1);
      const bullet = points.length
        ? `<ul class="iv-hl"><li>${esc(
            points[0]!.length > 96 ? points[0]!.slice(0, 96).trimEnd() + "…" : points[0]!,
          )}</li></ul>`
        : "";
      return `<div class="iv-rl-rung">
        ${nonEmpty(e.role) ? `<div class="iv-item-t">${esc(e.role)}</div>` : ""}
        ${meta ? `<div class="iv-item-m">${esc(meta)}</div>` : ""}
        ${bullet}
      </div>`;
    })
    .join("");
}

function build(p: CardProfile): string {
  const contact = contactInline(p);
  const tail = joinBlocks([
    section("Skills", () => chips(p.skills, SHOW.skills)),
    section("Certifications", () => certificationList(p, SHOW.certifications)),
    section("Awards", () => achievementList(p, SHOW.achievements)),
    section("Publications", () => publicationList(p, SHOW.publications)),
    section("Registrations", () => registrationRows(p, SHOW.registrations)),
  ]);
  const socials = socialIcons(p.socialLinks, SHOW.socials);

  return `<div class="iv-rl-wrap">
    <header class="iv-rl-head">
      <div class="iv-rl-head-txt">${nameBlock(p)}${bio(p, 120)}</div>    </header>
    ${contact ? `<div class="iv-rl-contact">${contact}</div>` : ""}
    <div class="iv-rl-ladder">${rungs(p)}</div>
    ${tail ? `<div class="iv-rl-tail">${tail}</div>` : ""}
    ${socials ? `<div class="iv-rl-social">${socials}</div>` : ""}
  </div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
/* No colour block anywhere on this card. The brand colour appears only in the
   rung bars, which is what keeps the staircase the loudest thing on it. */
${s}.iv-role-ladder{background:var(--iv-surface)}
${s} .iv-rl-wrap{padding:1.15em 1.1em}

${s} .iv-rl-head{display:flex;align-items:flex-start;gap:.6em}
${s} .iv-rl-head-txt{min-width:0;flex:1 1 auto}
${s} .iv-rl-contact{margin-top:.4em}

${s} .iv-rl-ladder{margin-top:.9em}
/* Each rung carries its own bar. A single continuous spine would make this the
   Timeline card with the dots removed. */
${s} .iv-rl-rung{position:relative;padding:.15em 0 .15em .8em;border-left:.2em solid var(--iv-primary)}
${s} .iv-rl-rung+.iv-rl-rung{margin-top:.55em}

/* The staircase. Each step is one indent deeper, and the bar fades with depth so
   the most recent role reads as the strongest without needing a label. */
${s} .iv-rl-rung:nth-child(2){margin-left:.95em;border-left-color:color-mix(in srgb,var(--iv-primary) 78%,var(--iv-surface))}
${s} .iv-rl-rung:nth-child(3){margin-left:1.9em;border-left-color:color-mix(in srgb,var(--iv-primary) 56%,var(--iv-surface))}
${s} .iv-rl-rung:nth-child(4){margin-left:2.85em;border-left-color:color-mix(in srgb,var(--iv-primary) 38%,var(--iv-surface))}

${s} .iv-rl-tail{margin-top:1em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 20%,transparent)}
${s} .iv-rl-tail .iv-sec-h:first-child{margin-top:.7em}
${s} .iv-rl-social{margin-top:.8em}

/* A narrow card cannot afford three indents plus a role title, so the staircase
   tightens rather than letting titles wrap to two lines each. */
@container (max-width:320px){
  ${s} .iv-rl-rung:nth-child(2){margin-left:.55em}
  ${s} .iv-rl-rung:nth-child(3){margin-left:1.1em}
  ${s} .iv-rl-rung:nth-child(4){margin-left:1.65em}
}
</style>`;
}

export const roleLadder = { build, styles };
