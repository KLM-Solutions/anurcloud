/**
 * Insta VIZ smart-card templates — catalogue and the recommendation brain.
 *
 *   import { templatesFor, suggestTemplates, eligibleTemplates } from "@/templates";
 *
 * The cards themselves render as React components in `components/cards/` — this
 * module has NO render path. It owns the catalogue metadata (names, descriptions,
 * audiences, minimums) and the eligibility + ranking logic that decides WHICH
 * cards to offer a profile. `/api/template` calls into here; the React registry
 * (`components/cards/registry.tsx`) renders the chosen card client-side.
 *
 * ── Adding a template ─────────────────────────────────────────────────────
 *   1. add its React component in `components/cards/` + a line in `registry.tsx`
 *   2. add a `PLANNED` entry here (metadata: name, description, audience, key)
 *
 * ⚠️ Nothing in `templates/` may import from `lib/` or `app/` (DEV-3040).
 */

import type {
  CardProfile,
  ProfileType,
  TemplateEligibility,
  TemplateInfo,
  TemplateKey,
} from "./types";
import { eligibilityFor, minimumLabel, dataLevel } from "./guards";
import { rankTemplates, topSuggestions, type Suggestion } from "./rank";

export * from "./types";
export { resolveTheme } from "./theme";
export { dataLevel, meetsMinimum, minimumLabel } from "./guards";
export type { DataLevel } from "./guards";

interface PlannedTemplate {
  id: number;
  key: TemplateKey;
  name: string;
  description: string;
  audience: ProfileType;
  /** Extra class on the card root, enabling that card's layout CSS. */
  rootClass: string;
}

/**
 * The v1 set: 10 student, 10 professional. Structure-first by design — the
 * client's 3 Aug 2026 feedback was that our prototypes shared one skeleton, so
 * each of these differs in *where things sit*, not in colour.
 *
 * The test is grayscale. `npm run preview` renders the whole set with the colour
 * removed; if two cards are hard to tell apart there, they are one card.
 */
const PLANNED: PlannedTemplate[] = [
  {
    id: 1,
    key: "side-rail",
    name: "Side Rail",
    description:
      "Full-height coloured rail down the left holding avatar and contact; content to the right. Reads across, not down — no top banner.",
    audience: "student",
    rootClass: "iv-side-rail",
  },
  {
    id: 2,
    key: "hero-split",
    name: "Hero Split",
    description:
      "Hero band carrying the name, a two-column body beneath it, and a full-width row at the bottom. Three bands, not one stack.",
    audience: "student",
    rootClass: "iv-hero-split",
  },
  {
    id: 3,
    key: "centre-portrait",
    name: "Centre Portrait",
    description:
      "No colour block anywhere. Centred portrait and a narrow centred column separated by thin rules. Hierarchy from typography and whitespace.",
    audience: "student",
    rootClass: "iv-centre-portrait",
  },
  {
    id: 4,
    key: "timeline",
    name: "Timeline",
    description:
      "A dated spine down the left, education and internships and projects interleaved chronologically. Organised by time, not by section.",
    audience: "student",
    rootClass: "iv-timeline",
  },
  {
    id: 5,
    key: "tile-grid",
    name: "Tile Grid",
    description:
      "Modular tiles of equal weight, identity demoted to one tile among peers. No single reading order.",
    audience: "student",
    rootClass: "iv-tile-grid",
  },
  {
    id: 6,
    key: "ticket-stub",
    name: "Ticket Stub",
    description:
      "An event ticket: a coloured header carries the identity, a dashed perforation with a notch bitten out of each edge tears it off, and the content sits on the stub below. The tear-and-notch silhouette is unique in the set.",
    audience: "student",
    rootClass: "iv-ticket-stub",
  },
  {
    id: 7,
    key: "corner-wedge",
    name: "Corner Wedge",
    description:
      "A diagonal colour wedge across the top-left with the identity set into it and a narrow column tucked beside. The only non-rectangular colour region in the set.",
    audience: "student",
    rootClass: "iv-corner-wedge",
  },
  {
    id: 8,
    key: "monogram-block",
    name: "Monogram Block",
    description:
      "A square colour block holding the monogram as oversized type, with the identity set beside it on white and the body full-width below. No banner and no circle anywhere.",
    audience: "student",
    rootClass: "iv-monogram-block",
  },
  {
    id: 9,
    key: "index-ledger",
    name: "Index Ledger",
    description:
      "A spec sheet: right-aligned label gutter down the left, values beside it, one hairline per row. Headings sit beside their content, never above it.",
    audience: "student",
    rootClass: "iv-index-ledger",
  },
  {
    id: 10,
    key: "column-flow",
    name: "Column Flow",
    description:
      "A newspaper masthead over a genuine two-column text flow — sections run down one column and continue into the next. No colour block, no avatar.",
    audience: "student",
    rootClass: "iv-column-flow",
  },

  /* ── professional ────────────────────────────────────────────────────────
   * Designed against the student set as much as against each other. Three of
   * them are built on fields the student schema does not have at all
   * (`total_years_experience`, `experience[].highlights`), so the two pools are
   * not the same cards with a different label — they differ in what they can
   * show as well as in how they arrange it.
   *
   * The first ten use no initials circle and put no identity inside a full-width
   * top band — two of the four items on the client's 3 Aug list, failed at pool
   * level. The two avatar cards below (21/22) are the deliberate, opt-in
   * exceptions to the circle rule so a professional's logo has a home; neither
   * uses a full-width top band.
   */
  {
    id: 11,
    key: "skill-meters",
    name: "Skill Meters",
    description:
      "The only chart in the set. Horizontal bars count how often each skill appears in the person's own role highlights — evidence from the document, captioned as such, never a proficiency rating.",
    audience: "professional",
    rootClass: "iv-skill-meters",
  },
  {
    id: 12,
    key: "split-halves",
    name: "Split Halves",
    description:
      "Two equal full-height halves meeting on one line down the middle, colour on the right, both carrying real sections. A split, not a body with a sidebar.",
    audience: "professional",
    rootClass: "iv-split-halves",
  },
  {
    id: 13,
    key: "overlap",
    name: "Overlap",
    description:
      "A raised white plate pulled up over the bottom edge of a filled top zone, so the identity sits half on the colour and half on the page. The only layered card.",
    audience: "professional",
    rootClass: "iv-overlap",
  },
  {
    id: 14,
    key: "numbered",
    name: "Numbered",
    description:
      "An editorial contents page: every section numbered in sequence in a left gutter at graphic size, identity included as 00, separated by whitespace rather than rules.",
    audience: "professional",
    rootClass: "iv-numbered",
  },
  {
    id: 15,
    key: "folder-tab",
    name: "Folder Tab",
    description:
      "A file-folder tab: the identity sits on a part-width tab that stops short of the right edge, and the tab's base continues as a heavy rule across the card.",
    audience: "professional",
    rootClass: "iv-folder-tab",
  },
  {
    id: 16,
    key: "stat-strip",
    name: "Stat Strip",
    description:
      "Opens on a divided strip of oversized figures — years, roles, certifications — with the identity underneath on white. The only card that leads with data instead of a name.",
    audience: "professional",
    rootClass: "iv-stat-strip",
  },
  {
    id: 17,
    key: "role-ladder",
    name: "Role Ladder",
    description:
      "Each role is a rung with its own bar, indented one step further as it goes back in time. Career progression read from the shape before a word of it.",
    audience: "professional",
    rootClass: "iv-role-ladder",
  },
  {
    id: 18,
    key: "letterhead",
    name: "Letterhead",
    description:
      "Business stationery: a rule above the name, contact set right-aligned beside it, a hairline under the header and one narrow measure of text. No fill anywhere.",
    audience: "professional",
    rootClass: "iv-letterhead",
  },
  {
    id: 19,
    key: "edge-spine",
    name: "Edge Spine",
    description:
      "The name set vertically in a narrow filled strip down the right edge, like the spine of a book, with the body taking the rest. The only card that rotates anything.",
    audience: "professional",
    rootClass: "iv-edge-spine",
  },
  {
    id: 20,
    key: "pull-quote",
    name: "Pull Quote",
    description:
      "The identity as the caption, not the headline: the person's positioning line set as display type, with the name attributed underneath at a fraction of the size.",
    audience: "professional",
    rootClass: "iv-pull-quote",
  },

  /* ── professional avatar cards (DEV-3069/3070) ─────────────────────────────
   * The two deliberate exceptions to the pool's no-circle rule. They exist so a
   * professional who uploads a logo has somewhere to put it — the logo fills the
   * identity circle in place of the initials. Opt-in, not the default, and each
   * is structurally distinct from the other and from every student avatar card.
   */
  {
    id: 21,
    key: "badge",
    name: "Badge",
    description:
      "A corporate access badge: a small round photo and the name sit inside a bordered, lightly-tinted panel with a vertical accent bar between them, over a plain body. A boxed header, not a colour banner.",
    audience: "professional",
    rootClass: "iv-badge",
  },
  {
    id: 22,
    key: "spotlight",
    name: "Spotlight",
    description:
      "An oversized ringed portrait anchored into the top-left corner as a graphic element, the name beside it at the foot of the circle, and a full-width single-column body below. Asymmetric, portrait-led.",
    audience: "professional",
    rootClass: "iv-spotlight",
  },
];

/* ── catalogue ────────────────────────────────────────────────────────────── */

/**
 * Every planned card is built (all 22 ship as React components in
 * `components/cards/`). The catalogue therefore reflects the full set. If a card
 * is ever removed, drop its `PLANNED` entry rather than gating here — this module
 * cannot import the React registry without breaking the self-contained rule
 * (DEV-3040), so `PLANNED` is the single source of truth for what exists.
 */
const isAvailable = (): boolean => true;

function toInfo(t: PlannedTemplate): TemplateInfo {
  return {
    id: t.id,
    key: t.key,
    name: t.name,
    description: t.description,
    audience: t.audience,
    minimum: minimumLabel(t.key),
  };
}

/** Every template that can actually be rendered today. */
export const templates: TemplateInfo[] = PLANNED.filter(isAvailable).map(toInfo);

export const templateCount = templates.length;

/** Declared v1 set, including cards not yet built. For planning and docs only. */
export const plannedTemplates: TemplateInfo[] = PLANNED.map(toInfo);

/** Renderable templates for a profile type — the pool the recommender draws from. */
export function templatesFor(profileType: ProfileType): TemplateInfo[] {
  return templates.filter((t) => t.audience === profileType);
}

/* ── eligibility ──────────────────────────────────────────────────────────── */

/**
 * Which templates this profile can actually fill, and why the others can't.
 *
 * Gating is what keeps the ranked recommendation honest: a timeline needs a
 * sequence, a grid needs enough blocks, and offering either without the data
 * produces a card that renders badly.
 */
export function eligibleTemplates(profile: CardProfile): TemplateEligibility[] {
  return PLANNED.filter(isAvailable)
    .filter((t) => t.audience === profile.profileType)
    .map((t) => eligibilityFor(t.key, profile, { id: t.id, name: t.name }));
}

/** Just the ones that pass, in catalogue order. */
export function offerableTemplates(profile: CardProfile): TemplateInfo[] {
  const ok = new Set(
    eligibleTemplates(profile)
      .filter((e) => e.eligible)
      .map((e) => e.key),
  );
  return templates.filter((t) => ok.has(t.key));
}

/** How much content this profile carries — "rich" | "typical" | "thin". */
export { dataLevel as profileDataLevel };

/* ── suggestion ───────────────────────────────────────────────────────────── */

export { SUGGESTION_COUNT, profileFacts, rankTemplates, topSuggestions } from "./rank";
export type { FitTier, ProfileFacts, Suggestion } from "./rank";

/**
 * The three layouts to actually put in front of this user, best first.
 *
 * This is the entry point callers should use. `offerableTemplates()` above
 * answers "which could be filled", which for a rich profile is nearly all ten —
 * a catalogue, not a recommendation.
 *
 * Each suggestion carries plain-language reasons. There is deliberately no fit
 * percentage anywhere in the return value; see the note at the top of `rank.ts`.
 */
export function suggestTemplates(profile: CardProfile): Suggestion[] {
  const pool = templates.filter((t) => t.audience === profile.profileType);
  return topSuggestions(rankTemplates(profile, pool, eligibleTemplates(profile)));
}
