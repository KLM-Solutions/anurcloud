/**
 * Student template 6 — "Ticket Stub" (replaces Footer Anchor, 20 Aug 2026)
 *
 *   ┌──────────────────────┐
 *   │░ ( )  Name          ░│  ← coloured ticket top
 *   │░      Course · mail ░│
 *   ◗- - - - - - - - - - - ◖  ← perforation + a notch cut into each edge
 *   │  About / Education   │
 *   │  Projects / Skills   │  ← the stub: content below the tear
 *   └──────────────────────┘
 *
 * Structurally: an event ticket. A coloured header band carries the identity,
 * then a dashed perforation line with a semicircular notch bitten out of the
 * left and right card edges, and the content sits on the stub below. Nothing
 * else in the set has the tear-and-notch silhouette, so it reads as a ticket in
 * grayscale — the notches and the dashed line are the tell, not the colour.
 *
 * ── Not Hero Split ──────────────────────────────────────────────────────────
 * Hero Split also opens on a coloured band, but it has no perforation, no edge
 * notches, and a two-column body. This is a single-column stub with the tear as
 * its defining feature. Set side by side in grayscale they are not confusable.
 *
 * Thin data: the ticket top carries name, course and contact, so it is never
 * empty while a name exists; a bare profile reads as a ticket with a short stub.
 * Minimum: name + 1 fillable section — below that the stub has nothing to hold.
 *
 * ── Pagination + completeness (20 Aug 2026) ─────────────────────────────────
 * Every field shows. The ticket top is the page-1 chrome; the stub sections are
 * the blocks that flow across uniform pages (a long section auto-splits). One
 * ordered list, `sections()`, feeds both `build()` and `paged()`.
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
  extracurricularList,
  internshipList,
  projectList,
  publicationList,
  socialIcons,
} from "../sections";

/** The stub content sections, in order — the one list both render paths use. */
function sections(p: CardProfile): PageBlock[] {
  const out: PageBlock[] = [];
  const add = (html: string, weight: number) => {
    if (html.trim()) out.push({ html, weight });
  };
  add(section("About", () => bio(p, SHOW.bioChars)), linesForText(p.bio));
  add(section("Education", () => educationList(p, SHOW.education)), linesForItems(p.education.length));
  add(section("Projects", () => projectList(p, SHOW.projects)), linesForItems(p.projects.length, 3));
  add(section("Internships", () => internshipList(p, SHOW.internships)), linesForItems(p.internships.length));
  add(section("Certifications", () => certificationList(p, SHOW.certifications)), linesForItems(p.certifications.length));
  add(section("Skills", () => chips(p.skills, SHOW.skills)), Math.ceil(p.skills.length / 3) + 1);
  add(section("Languages", () => chips(p.languages, SHOW.languages)), Math.ceil(p.languages.length / 4) + 1);
  add(section("Awards", () => achievementList(p, SHOW.achievements)), linesForItems(p.achievements.length));
  add(section("Publications", () => publicationList(p, SHOW.publications)), linesForItems(p.publications.length));
  add(section("Activities", () => extracurricularList(p, SHOW.extracurriculars)), linesForItems(p.extracurriculars.length));
  const socials = socialIcons(p.socialLinks, SHOW.socials);
  add(socials ? `<div class="iv-tk-social">${socials}</div>` : "", 2);
  return out;
}

/** The coloured ticket top + the perforation — the card's page-1 chrome. */
function ticketTop(p: CardProfile, theme: ResolvedTheme): string {
  const contact = contactInline(p);
  return `<div class="iv-tk-top">
      ${avatar(p, "iv-tk-av", theme.logo?.url)}
      <div class="iv-tk-who">
        ${nonEmpty(p.fullName) ? `<div class="iv-name">${esc(p.fullName)}</div>` : ""}
        ${nonEmpty(p.designation) ? `<div class="iv-role">${esc(p.designation)}</div>` : ""}
        ${contact ? `<div class="iv-cinline">${contact}</div>` : ""}
      </div>
    </div>
    <div class="iv-tk-perf" aria-hidden="true"></div>`;
}

function build(p: CardProfile, theme: ResolvedTheme): string {
  const body = sections(p)
    .map((b) => b.html)
    .join("");
  return `<div class="iv-page">${ticketTop(p, theme)}${body}</div>`;
}

function paged(p: CardProfile, theme: ResolvedTheme): PagedContent {
  return {
    chrome: ticketTop(p, theme),
    slim: nonEmpty(p.fullName) ? esc(p.fullName) : "",
    blocks: sections(p),
    chromeWeight: 5, // the ticket top (avatar + name + role + contact)
  };
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-ticket-stub{background:var(--iv-surface)}
/* No top padding on the page: the ticket top is full-bleed and owns the top edge.
   The stub content below gets the horizontal padding.
   (No backticks in this block — it is inside a template literal.) */
${s} .iv-page{padding:0 1.15em 1.15em}

/* The coloured ticket top. Full-bleed via negative margins that cancel the page
   padding, so the band runs edge to edge like the head of a real ticket. */
${s} .iv-tk-top{margin:0 -1.15em;padding:1.15em 1.15em 1.2em;background:var(--iv-grad);color:var(--iv-onp);display:flex;align-items:center;gap:.7em}
${s} .iv-tk-av{width:3.2em;height:3.2em;box-shadow:0 0 0 2px color-mix(in srgb,var(--iv-onp) 40%,transparent)}
${s} .iv-tk-top .iv-av-fallback{background:color-mix(in srgb,var(--iv-onp) 18%,transparent);color:var(--iv-onp)}
${s} .iv-tk-who{min-width:0;flex:1 1 auto}
${s} .iv-tk-top .iv-name{font-size:1.15em;color:var(--iv-onp)}
/* The muted tokens are tuned for a light surface; on the band they must invert. */
${s} .iv-tk-top .iv-role,${s} .iv-tk-top .iv-cinline{color:color-mix(in srgb,var(--iv-onp) 80%,transparent)}
${s} .iv-tk-top .iv-cinline{font-size:.68em;margin-top:.2em}

/* The perforation: a dashed tear line, full-bleed, with a notch bitten out of
   each side edge. The notch circles are surface-coloured and sit centred on the
   card's left/right edges — the card's overflow:hidden clips their outer half,
   leaving a clean semicircular bite where the tear meets each edge. */
${s} .iv-tk-perf{position:relative;height:0;margin:0 -1.15em;border-top:2px dashed color-mix(in srgb,var(--iv-primary) 45%,var(--iv-surface))}
${s} .iv-tk-perf::before,${s} .iv-tk-perf::after{content:"";position:absolute;top:-.72em;width:1.4em;height:1.4em;border-radius:50%;background:var(--iv-surface)}
${s} .iv-tk-perf::before{left:-.7em}
${s} .iv-tk-perf::after{right:-.7em}

/* The stub: content sits below the tear. First heading needs no extra top gap. */
${s} .iv-page > .iv-tk-perf + .iv-sec-h{margin-top:1em}
${s} .iv-page .iv-sec-h:first-of-type{margin-top:1em}
${s} .iv-tk-social{margin-top:.9em}

/* Continuation pages carry only stub sections — no ticket top — so they take the
   full padding and lead cleanly with their first section. */
${s} .iv-page-cont{padding:1.15em}
${s} .iv-page-cont .iv-sec-h:first-of-type{margin-top:0}
</style>`;
}

export const ticketStub = { build, styles, paged };
