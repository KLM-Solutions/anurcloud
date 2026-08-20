/**
 * Pagination — split a tall card into fixed-height pages instead of one growing
 * box (owner decision, 20 Aug 2026; see docs/anur-cloud/todos.md #3).
 *
 * ── The server has no DOM ──────────────────────────────────────────────────
 * We cannot measure real pixel heights at render time, so a card that opts into
 * pagination declares its body as an ordered list of BLOCKS, each with an
 * estimated weight in "lines" (the same unit as guards.contentVolume). The
 * engine packs blocks into pages up to a per-page line budget.
 *
 * ── Uniform page size, nothing clipped ─────────────────────────────────────
 * When a card paginates, every page is the SAME fixed height (`--iv-page-h`) so
 * a template reads as a set of equal pages, like a printed document. Packing is
 * strict — a page is never filled past the budget — which is what keeps the
 * heights equal. The height is a `min-height`, not a hard clip: if an estimate
 * is a little off, a page runs a touch longer rather than hiding content.
 * Content is never dropped; the budget only decides where a page breaks.
 *
 * ── Backward compatible ────────────────────────────────────────────────────
 * A card that does not export `paged()` renders exactly as before (one page, no
 * wrapper). Cards are migrated to pagination one at a time.
 */

import type { CardProfile } from "./types";

export interface PageBlock {
  /** Rendered HTML for this block ("" blocks are dropped by the engine). */
  html: string;
  /** Estimated height in "lines". Heavier blocks push the page break sooner. */
  weight: number;
  /**
   * When set, this block is a SPLITTABLE section: `items` are its rows and the
   * packer may break between them across pages, rather than moving the whole
   * section to the next page and leaving a gap. `heading` (e.g. a section title)
   * is re-emitted at the top of each page the section spans, with " (cont.)" on
   * continuations. A section that fits entirely renders exactly like an atomic
   * block. This is how a long Experience/Projects list flows instead of forcing
   * an early page break.
   */
  items?: PageBlock[];
  /** Section heading HTML (without the items) — re-shown when the group splits. */
  heading?: string;
  /** Title text for a " (cont.)" marker when the group continues on a new page. */
  headingTitle?: string;
}

/**
 * Build a splittable section block from a heading + its item rows. If there are
 * no items it returns null (nothing to show). `headingHtml` is the full heading
 * markup (e.g. `<h3 class="iv-sec-h">Experience</h3>`); `title` is the plain text
 * used for the "(cont.)" marker on continuation pages.
 */
export function groupBlock(
  headingHtml: string,
  title: string,
  items: PageBlock[],
): PageBlock | null {
  const real = items.filter((i) => i.html.trim().length > 0);
  if (real.length === 0) return null;
  const weight = real.reduce((n, i) => n + i.weight, 1);
  return { html: headingHtml + real.map((i) => i.html).join(""), weight, items: real, heading: headingHtml, headingTitle: title };
}

/**
 * What a paginated card returns.
 *  - `chrome`  : the card's designed identity/hero — always on page 1.
 *  - `slim`    : a compact header repeated at the top of pages 2+.
 *  - `blocks`  : the ordered content blocks to flow across pages.
 */
export interface PagedContent {
  /**
   * Simple path (single-column cards): identity/header markup placed ABOVE the
   * page-1 blocks. Ignored when `firstPage` is given.
   */
  chrome?: string;
  /**
   * Rich path (multi-column cards): the card renders page 1 ITSELF, given only
   * the blocks that fit, so a full-height rail / split / grid survives intact.
   * Overflow blocks flow to single-column continuation pages. Takes precedence
   * over `chrome`.
   */
  firstPage?: (fitBlocks: PageBlock[]) => string;
  slim: string;
  blocks: PageBlock[];
  /** Override the per-page line budget (default PAGE_BUDGET_LINES). */
  budget?: number;
  /** Lines the page-1 chrome already occupies, so page 1 breaks earlier. */
  chromeWeight?: number;
}

/**
 * Lines that fit on one page at the default card size. Calibrated against the
 * A4-proportion page height (~537px at md width); the Chrome overflow rig is
 * what tightens this if a real page over/under-fills.
 */
export const PAGE_BUDGET_LINES = 20;

/**
 * Estimate lines for a run of text. Deliberately CONSERVATIVE (a low chars-per-
 * line) so the estimate is an upper bound: strict packing must never under-count
 * and overflow a fixed-height page, which would make pages different sizes. It is
 * better to break a page a line early (min-height pads the small gap) than a line
 * late (the page grows past the others).
 */
export function linesForText(text: string | null | undefined, perLine = 34): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.trim().length / perLine));
}

/** Estimate lines for an N-item list at `perItem` lines each, plus a heading. */
export function linesForItems(count: number, perItem = 3, heading = 1): number {
  return count <= 0 ? 0 : heading + count * perItem;
}

/**
 * Greedy-pack blocks into pages up to `budget` lines each. A single block heavier
 * than a whole page takes its own page (we have no sub-block detail to split it
 * further — better a slightly long page than lost content). Page 1's budget is
 * reduced by `chromeWeight` so the identity block leaves room.
 */
/**
 * Turn a plain section block into a SPLITTABLE one when it is shaped like a
 * standard section — an `<h3>` heading followed by sibling `.iv-item` rows and
 * nothing wrapping them. This lets any list section (Projects, Education, Awards,
 * …) flow across pages so no single section overflows a fixed-height page, with
 * NO per-card change. Blocks that already declare `items`, or that open with a
 * card-specific wrapper (so splitting would unbalance its tags), are left as-is.
 */
const ITEM = '<div class="iv-item">';
function autoSplit(b: PageBlock): PageBlock {
  if (b.items || !b.html.startsWith("<h3")) return b;
  const first = b.html.indexOf(ITEM);
  if (first === -1) return b;
  const heading = b.html.slice(0, first);
  const rest = b.html.slice(first);
  const parts = rest.split(ITEM).filter((s) => s.length > 0);
  if (parts.length < 2) return b; // one item — nothing to gain
  const items: PageBlock[] = parts.map((p) => {
    const html = ITEM + p;
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return { html, weight: Math.max(2, Math.ceil(text.length / 40)) };
  });
  const title = heading.replace(/<[^>]+>/g, "").trim();
  return groupBlock(heading, title, items) ?? b;
}

export function paginate(
  blocks: PageBlock[],
  budget = PAGE_BUDGET_LINES,
  chromeWeight = 0,
): PageBlock[][] {
  const real = blocks.filter((b) => b.html.trim().length > 0).map(autoSplit);
  if (real.length === 0) return [[]];

  const pages: PageBlock[][] = [];
  let cur: PageBlock[] = [];
  let used = 0;
  let cap = Math.max(budget - chromeWeight, Math.ceil(budget / 2)); // page 1 leaves room for chrome

  const newPage = () => {
    if (cur.length > 0) pages.push(cur);
    cur = [];
    used = 0;
    cap = budget;
  };

  for (const b of real) {
    const fits = used + b.weight <= cap;
    if (fits) {
      cur.push(b);
      used += b.weight;
      continue;
    }

    // Doesn't fit as-is. If it's a splittable section, flow its items across
    // pages: fill the current page WITHOUT exceeding it (strict), the rest
    // continue on the next page. Strict packing is what keeps every page the
    // same height — no page runs past the fixed page size.
    if (b.items && b.items.length > 1) {
      let first = true;
      let rest = b.items;
      while (rest.length > 0) {
        const remaining = cap - used - (first ? 0 : 1); // 1 for a re-shown heading
        const take: PageBlock[] = [];
        let w = 0;
        for (const it of rest) {
          if (take.length > 0 && w + it.weight > remaining) break; // don't exceed the page
          take.push(it);
          w += it.weight;
        }
        if (take.length === 0) {
          // Not even one item fits in the sliver left — start a fresh page.
          newPage();
          continue;
        }
        const headingHtml = first ? b.heading ?? "" : contHeading(b);
        cur.push({ html: headingHtml + take.map((i) => i.html).join(""), weight: w + 1 });
        used += w + 1;
        rest = rest.slice(take.length);
        first = false;
        if (rest.length > 0) newPage(); // more to place → next page
      }
      continue;
    }

    // Atomic block that doesn't fit: move it to a fresh page (strict — never
    // overflow the current page). A block larger than a whole page still takes
    // its own page and is the one place a page can exceed the fixed height.
    if (cur.length > 0) newPage();
    cur.push(b);
    used += b.weight;
  }
  if (cur.length > 0) pages.push(cur);
  return pages;
}

/** A section heading re-shown when a split section continues on a new page. */
function contHeading(b: PageBlock): string {
  if (!b.heading) return "";
  if (b.headingTitle) {
    // Replace the title text with "Title (cont.)" inside the same heading markup.
    return b.heading.replace(b.headingTitle, `${b.headingTitle} (cont.)`);
  }
  return b.heading;
}

/**
 * Render a paginated card body: page 1 carries the chrome, pages 2+ a slim
 * header. Each page is an `.iv-page`; a card with a single page still gets one
 * wrapper so the page frame is consistent.
 */
export function renderPages(content: PagedContent): string {
  const { chrome, firstPage, slim, blocks, budget = PAGE_BUDGET_LINES, chromeWeight = 0 } = content;
  const pages = paginate(blocks, budget, chromeWeight);

  // Uniform page size: when a card paginates, EVERY page (including the last) is
  // the same fixed height, like the pages of a printed document. Combined with
  // strict packing above (no page exceeds the budget), all pages of a template
  // render at one consistent size. A single-page card is left at its natural
  // height — one page has nothing to be uniform with, and "thin data looks
  // deliberate" is a standing rule.
  const multi = pages.length > 1;
  const fillClass = () => (multi ? " iv-page--filled" : "");

  return pages
    .map((page, i) => {
      const num = pages.length > 1 ? `<span class="iv-page-num" aria-hidden="true">${i + 1}/${pages.length}</span>` : "";
      if (i === 0) {
        // Page 1: the card lays out the fitting blocks itself (multi-column) or
        // we stack them under the chrome (single-column).
        const body = firstPage ? firstPage(page) : `${chrome ?? ""}${page.map((b) => b.html).join("")}`;
        return `<div class="iv-page${fillClass()}">${body}${num}</div>`;
      }
      // Continuation pages are always a single-column stack with a slim header.
      const header = slim ? `<div class="iv-page-slim">${slim}</div>` : "";
      return `<div class="iv-page${fillClass()} iv-page-cont">${header}${page.map((b) => b.html).join("")}${num}</div>`;
    })
    .join("");
}

/** Convenience: total estimated pages for a paged card (for the API `pages` count). */
export function pageCount(content: PagedContent): number {
  return paginate(content.blocks, content.budget ?? PAGE_BUDGET_LINES, content.chromeWeight ?? 0).length;
}

/** Re-export so cards can weight blocks off the same volume signal if they wish. */
export type { CardProfile };
