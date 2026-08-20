/**
 * Professional template 21 — "Badge" (DEV-3069)
 *
 *   ┌────────────────────────────┐
 *   │ ╭────────────────────────╮ │
 *   │ │ (o) ▏ ARUN KUMAR       │ │
 *   │ │     ▏ Senior Engineer  │ │
 *   │ │     ▏ Acme · Chennai   │ │
 *   │ ╰────────────────────────╯ │
 *   │ EXPERIENCE                 │
 *   │ Role · Company             │
 *   │ SKILLS                     │
 *   └────────────────────────────┘
 *      ^ laminated ID panel, avatar + accent bar
 *
 * Structurally: a corporate access badge. The identity sits inside a bordered,
 * lightly-tinted panel — a laminated card, not a full-width colour band — with a
 * small round photo on the left, a vertical accent bar, and the name beside it.
 * The body is a plain single column below the badge.
 *
 * ── One of the two professional AVATAR cards (owner's call, 18 Aug 2026) ──────
 * The other ten professional cards carry no identity circle by design (the
 * client's 3 Aug "look-alike" note). Badge and Spotlight are the deliberate
 * exceptions: they exist so a professional who uploads a logo has somewhere to
 * put it — the logo drops into the circle in place of the initials. That is the
 * whole reason these two carry a circle, and it is why they are opt-in rather
 * than the default.
 *
 * ── Not Side Rail ────────────────────────────────────────────────────────────
 * Side Rail (student 1) is the other card with the avatar on the left, and it is
 * the opposite structurally: a full-height SOLID colour rail down the whole card.
 * Here there is no rail and no full-width fill — just a bordered panel at the top
 * on the white surface. In grayscale one is a dark column, the other a boxed
 * header.
 *
 * Minimum: name + 2 fillable sections — a badge over an empty body is a sticker.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { avatar, esc, nonEmpty } from "../helpers";
import { section } from "../guards";
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

/** The laminated badge panel — the card's signature, always on page 1. */
function badgePanel(p: CardProfile, theme: ResolvedTheme): string {
  const contact = contactInline(p);
  const sub = [p.designation, p.currentCompany].filter(nonEmpty).join(" · ");
  return `<header class="iv-bd-badge">
      ${avatar(p, "iv-bd-av", theme.logo?.url)}
      <div class="iv-bd-who">
        ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
        ${sub ? `<div class="iv-role">${esc(sub)}</div>` : ""}
        ${contact ? `<div class="iv-bd-contact">${contact}</div>` : ""}
        ${experienceYears(p)}
      </div>
    </header>`;
}

/** The body sections + footer, in order — one list both render paths consume. */
function contentBlocks(p: CardProfile): PageBlock[] {
  const out: PageBlock[] = [];
  const add = (html: string, weight: number) => {
    if (html.trim()) out.push({ html, weight });
  };
  add(section("Profile", () => bio(p, SHOW.bioChars)), linesForText(p.bio) + 1);
  const exp = experienceGroup(p, SHOW.roles, SHOW.highlightsPerRole);
  if (exp) out.push(exp);
  add(section("Skills", () => chips(p.skills, SHOW.skills)), Math.ceil(p.skills.length / 3) + 1);
  add(section("Projects", () => projectList(p, SHOW.projects)), linesForItems(p.projects.length, 3));
  add(section("Certifications", () => certificationList(p, SHOW.certifications)), linesForItems(p.certifications.length));
  add(section("Awards", () => achievementList(p, SHOW.achievements)), linesForItems(p.achievements.length));
  add(section("Publications", () => publicationList(p, SHOW.publications)), linesForItems(p.publications.length));
  add(section("Registrations", () => registrationRows(p, SHOW.registrations)), linesForItems(p.registrations.length));
  add(section("Education", () => educationList(p, SHOW.education)), linesForItems(p.education.length));
  add(section("Languages", () => chips(p.languages, SHOW.languages)), Math.ceil(p.languages.length / 4) + 1);

  const site = websiteLine(p);
  const socials = socialIcons(p.socialLinks, SHOW.socials);
  add(site || socials ? `<footer class="iv-bd-foot">${site}${socials}</footer>` : "", 2);
  return out;
}

/** Page 1: the badge panel above the body sections that fit. */
function firstPage(p: CardProfile, theme: ResolvedTheme, fit: PageBlock[]): string {
  const body = fit.map((b) => b.html).join("");
  return `<div class="iv-bd-wrap">${badgePanel(p, theme)}<main class="iv-bd-body">${body}</main></div>`;
}

function build(p: CardProfile, theme: ResolvedTheme): string {
  return firstPage(p, theme, contentBlocks(p));
}

function paged(p: CardProfile, theme: ResolvedTheme): PagedContent {
  return {
    firstPage: (fit) => firstPage(p, theme, fit),
    slim: nonEmpty(p.fullName) ? esc(p.fullName) : "",
    blocks: contentBlocks(p),
    chromeWeight: 5, // the badge panel
  };
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-badge{background:var(--iv-surface)}
${s} .iv-bd-wrap{padding:1.1em 1.05em 1.05em}
/* Continuation pages have no badge panel — the overflow sections sit in a plain
   column with the same padding. */
${s} .iv-page-cont{padding:1.1em 1.05em 1.05em}
${s} .iv-page-cont .iv-sec-h:first-of-type{margin-top:0}

/* The laminated panel: a real border plus a faint brand tint, so it reads as a
   card-within-a-card rather than a coloured banner. Border and tint both survive
   a PDF path — no translucency doing structural work.
   (No backticks in this block — it is inside a template literal.) */
${s} .iv-bd-badge{display:flex;align-items:center;gap:.7em;padding:.7em .8em;border:1px solid color-mix(in srgb,var(--iv-primary) 34%,var(--iv-edge));border-radius:.6em;background:color-mix(in srgb,var(--iv-primary) 6%,var(--iv-surface))}
${s} .iv-bd-av{width:3.4em;height:3.4em;flex:0 0 auto}
/* The accent bar is the badge's tell — a vertical brand stripe between photo and
   name, the way an ID card divides the mugshot from the details. */
${s} .iv-bd-who{min-width:0;padding-left:.75em;border-left:3px solid var(--iv-primary)}
${s} .iv-bd-who .iv-name{font-size:1.15em}
${s} .iv-bd-contact{margin-top:.25em}

${s} .iv-bd-body{margin-top:1.05em}
${s} .iv-bd-body .iv-sec-h:first-child{margin-top:0}
${s} .iv-bd-body .iv-item+.iv-item{margin-top:.4em}

${s} .iv-bd-foot{margin-top:1.05em;padding-top:.7em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 20%,transparent);display:flex;align-items:center;justify-content:space-between;gap:.5em;flex-wrap:wrap}
${s} .iv-bd-foot .iv-cinline{color:var(--iv-primary)}

@container (max-width:320px){
  ${s} .iv-bd-badge{gap:.55em;padding:.6em .65em}
  ${s} .iv-bd-av{width:3em;height:3em}
}
</style>`;
}

export const badge = { build, styles, paged };
